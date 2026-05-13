const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();

const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';
const OIDC_ISSUER = process.env.OIDC_ISSUER || 'http://localhost:5556/dex';
const OIDC_INTERNAL_URL = process.env.OIDC_INTERNAL_URL || 'http://localhost:5556/dex';
const CLIENT_ID = process.env.OIDC_CLIENT_ID || 'gateway-client';
const CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || 'gateway-secret';
const CALLBACK_URL = process.env.OIDC_CALLBACK_URL || 'http://localhost:3001/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// In-memory state store (state → nonce mapping for CSRF protection)
const pendingStates = new Map();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: false,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Kick off OIDC login
app.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  pendingStates.set(state, { nonce, createdAt: Date.now() });

  // Clean up stale states (older than 10 minutes)
  for (const [k, v] of pendingStates.entries()) {
    if (Date.now() - v.createdAt > 600_000) pendingStates.delete(k);
  }

  const authUrl = new URL(`${OIDC_ISSUER}/auth`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  res.redirect(authUrl.toString());
});

// OIDC callback
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}?auth_error=${encodeURIComponent(error)}`);
  }

  if (!state || !pendingStates.has(state)) {
    return res.redirect(`${FRONTEND_URL}?auth_error=invalid_state`);
  }

  const { nonce } = pendingStates.get(state);
  pendingStates.delete(state);

  try {
    // Exchange authorization code for tokens using the internal Docker network URL
    const tokenResponse = await axios.post(
      `${OIDC_INTERNAL_URL}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: CALLBACK_URL,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10_000,
      }
    );

    const { id_token } = tokenResponse.data;

    // Decode the ID token (we trust Dex in this internal setup)
    const claims = jwt.decode(id_token);

    if (!claims) {
      return res.redirect(`${FRONTEND_URL}?auth_error=invalid_token`);
    }

    // Issue our own session token so the frontend can authenticate API calls
    const sessionToken = jwt.sign(
      {
        sub: claims.sub,
        email: claims.email,
        name: claims.name || claims.preferred_username || claims.email,
      },
      SESSION_SECRET,
      { expiresIn: '8h' }
    );

    // Register/Update user in progress service (MongoDB) upon login
    try {
      await axios.post(`${PROGRESS_SERVICE_URL}/progress/${claims.sub}`, {
        email: claims.email,
        name: claims.name || claims.preferred_username || claims.email,
        // We don't send 'progress' here to avoid overwriting existing progress on login
      });
      console.log(`User ${claims.email} registered/updated in progress service`);
    } catch (regErr) {
      console.error('Failed to register user in progress service:', regErr.message);
      // We don't block the login if this fails, but we log it
    }

    // Set auth_token cookie for Nginx and frontend
    res.cookie('auth_token', sessionToken, {
      httpOnly: false, // Accessible by frontend JS if needed
      path: '/',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.redirect(`${FRONTEND_URL}?token=${encodeURIComponent(sessionToken)}`);
  } catch (err) {
    console.error('Token exchange error:', err.message);
    res.redirect(`${FRONTEND_URL}?auth_error=token_exchange_failed`);
  }
});

// Return current user info (token comes as Authorization: Bearer <token>)
app.get('/api/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SESSION_SECRET);
    res.json({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Logout — clear cookie and instruct the frontend to drop the token
app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect(`${FRONTEND_URL}?logout=true`);
});

// --- Progress Endpoints ---

app.get('/api/progress', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SESSION_SECRET);
    const response = await axios.get(`${PROGRESS_SERVICE_URL}/progress/${payload.sub}`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching progress:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/progress', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SESSION_SECRET);
    const response = await axios.post(`${PROGRESS_SERVICE_URL}/progress/${payload.sub}`, {
      email: payload.email,
      name: payload.name,
      progress: req.body.progress
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error saving progress:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to save progress' });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log(`OIDC Issuer (browser): ${OIDC_ISSUER}`);
  console.log(`OIDC Internal URL:     ${OIDC_INTERNAL_URL}`);
  console.log(`Frontend URL:          ${FRONTEND_URL}`);
});
