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
const PROGRESS_SERVICE_URL = process.env.PROGRESS_SERVICE_URL || 'http://localhost:3002';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

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
    const claims = jwt.decode(id_token);

    if (!claims) {
      return res.redirect(`${FRONTEND_URL}?auth_error=invalid_token`);
    }

    // Determine role: super-admins (in ADMIN_EMAILS) always get 'admin'
    const isSuperAdmin = ADMIN_EMAILS.includes(claims.email);
    const registrationBody = {
      email: claims.email,
      name: claims.name || claims.preferred_username || claims.email,
    };
    if (isSuperAdmin) registrationBody.role = 'admin';

    // Register/update user in progress service (upsert — role is only set on insert for non-super-admins)
    let userRole = 'student';
    try {
      const regResponse = await axios.post(
        `${PROGRESS_SERVICE_URL}/progress/${claims.sub}`,
        registrationBody
      );
      userRole = regResponse.data.role || 'student';
      console.log(`User ${claims.email} synced to progress service with role "${userRole}"`);
    } catch (regErr) {
      console.error('Failed to sync user in progress service:', regErr.message);
      if (isSuperAdmin) userRole = 'admin';
    }

    const sessionToken = jwt.sign(
      {
        sub: claims.sub,
        email: claims.email,
        name: claims.name || claims.preferred_username || claims.email,
        role: userRole,
      },
      SESSION_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('auth_token', sessionToken, {
      httpOnly: false,
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.redirect(`${FRONTEND_URL}?token=${encodeURIComponent(sessionToken)}`);
  } catch (err) {
    console.error('Token exchange error:', err.message);
    res.redirect(`${FRONTEND_URL}?auth_error=token_exchange_failed`);
  }
});

// --- Middleware ---

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), SESSION_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Return current user info
app.get('/api/me', verifyToken, (req, res) => {
  res.json({
    sub: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role || 'student',
  });
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect(`${FRONTEND_URL}?logout=true`);
});

// --- Progress endpoints ---

app.get('/api/progress', verifyToken, async (req, res) => {
  try {
    const response = await axios.get(`${PROGRESS_SERVICE_URL}/progress/${req.user.sub}`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching progress:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch progress' });
  }
});

app.post('/api/progress', verifyToken, async (req, res) => {
  try {
    const response = await axios.post(`${PROGRESS_SERVICE_URL}/progress/${req.user.sub}`, {
      email: req.user.email,
      name: req.user.name,
      progress: req.body.progress
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error saving progress:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to save progress' });
  }
});

// --- Content endpoints (public read, admin write) ---

app.get('/api/content/:type', verifyToken, async (req, res) => {
  try {
    const response = await axios.get(`${PROGRESS_SERVICE_URL}/content/${req.params.type}`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching content:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch content' });
  }
});

app.put('/api/admin/content/:type', verifyToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.put(`${PROGRESS_SERVICE_URL}/content/${req.params.type}`, {
      data: req.body.data,
      updatedBy: req.user.email,
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error saving content:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to save content' });
  }
});

// --- Admin user management endpoints ---

app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(`${PROGRESS_SERVICE_URL}/users`);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/admin/users/:userId/role', verifyToken, requireAdmin, async (req, res) => {
  // Prevent demoting a super-admin via the panel
  const targetUserId = req.params.userId;
  try {
    const userRes = await axios.get(`${PROGRESS_SERVICE_URL}/users`);
    const targetUser = userRes.data.find(u => u.userId === targetUserId);
    if (targetUser && ADMIN_EMAILS.includes(targetUser.email) && req.body.role !== 'admin') {
      return res.status(400).json({ error: 'Cannot demote a super-admin' });
    }
    const response = await axios.put(`${PROGRESS_SERVICE_URL}/users/${targetUserId}/role`, {
      role: req.body.role,
    });
    res.json(response.data);
    } catch (err) {
    console.error('Error updating user role:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to update user role' });
    }
    });

    app.delete('/api/admin/users/:userId/progress', verifyToken, requireAdmin, async (req, res) => {
    try {
    const { userId } = req.params;
    const response = await axios.delete(`${PROGRESS_SERVICE_URL}/progress/${userId}`);
    res.json(response.data);
    } catch (err) {
    console.error('Error resetting user progress:', err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to reset progress' });
    }
    });

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log(`OIDC Issuer (browser): ${OIDC_ISSUER}`);
  console.log(`OIDC Internal URL:     ${OIDC_INTERNAL_URL}`);
  console.log(`Frontend URL:          ${FRONTEND_URL}`);
  console.log(`Admin emails:          ${ADMIN_EMAILS.join(', ') || '(none)'}`);
});
