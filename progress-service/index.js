const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/progress';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  progress: { type: Map, of: mongoose.Schema.Types.Mixed },
  mastered: { type: Map, of: mongoose.Schema.Types.Mixed },
  lastUpdated: { type: Date, default: Date.now }
});

const Progress = mongoose.model('Progress', progressSchema);

const contentSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  data: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: String
});

const Content = mongoose.model('Content', contentSchema);

// --- Organica Schemas ---

const organicaUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  addedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const OrganicaUser = mongoose.model('OrganicaUser', organicaUserSchema);

const organicaDomainSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true },
  addedBy: String,
  createdAt: { type: Date, default: Date.now }
});

const OrganicaDomain = mongoose.model('OrganicaDomain', organicaDomainSchema);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- Organica endpoints ---

app.get('/organica/users', async (req, res) => {
  try {
    const users = await OrganicaUser.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/organica/users', async (req, res) => {
  try {
    const { email, addedBy } = req.body;
    const user = new OrganicaUser({ email, addedBy });
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/organica/users/:id', async (req, res) => {
  try {
    await OrganicaUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/organica/domains', async (req, res) => {
  try {
    const domains = await OrganicaDomain.find().sort({ createdAt: -1 });
    res.json(domains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/organica/domains', async (req, res) => {
  try {
    const { domain, addedBy } = req.body;
    const dom = new OrganicaDomain({ domain, addedBy });
    await dom.save();
    res.json(dom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/organica/domains/:id', async (req, res) => {
  try {
    await OrganicaDomain.findByIdAndDelete(req.params.id);
    res.json({ message: 'Domain removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/organica/check/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const domain = email.split('@')[1];

    const userAllowed = await OrganicaUser.findOne({ email });
    if (userAllowed) return res.json({ allowed: true });

    const domainAllowed = await OrganicaDomain.findOne({ domain });
    if (domainAllowed) return res.json({ allowed: true });

    res.json({ allowed: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Progress endpoints ---

app.get('/progress/:userId', async (req, res) => {
  try {
    const progress = await Progress.findOne({ userId: req.params.userId });
    res.json(progress || { userId: req.params.userId, progress: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/progress/:userId', async (req, res) => {
  try {
    const { email, name, progress, mastered, role } = req.body;
    const updateFields = { email, name, lastUpdated: Date.now() };
    if (progress !== undefined) updateFields.progress = progress;
    if (mastered !== undefined) updateFields.mastered = mastered;
    if (role !== undefined) updateFields.role = role;

    // Only set role on insert (new users), existing users keep their role unless explicitly passed
    const updateOp = { $set: updateFields };
    if (role === undefined) updateOp.$setOnInsert = { role: 'student' };

    const result = await Progress.findOneAndUpdate(
      { userId: req.params.userId },
      updateOp,
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User management endpoints ---

app.get('/users', async (req, res) => {
  try {
    const users = await Progress.find({}, 'userId email name role lastUpdated').sort({ lastUpdated: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "student" or "admin".' });
    }
    const result = await Progress.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { role } },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/progress/:userId', async (req, res) => {
  try {
    const result = await Progress.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { progress: {}, mastered: {}, lastUpdated: Date.now() } },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Progress reset successfully', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Content endpoints ---

app.get('/content/:type', async (req, res) => {
  try {
    const content = await Content.findOne({ type: req.params.type });
    res.json(content || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/content/:type', async (req, res) => {
  try {
    const { data, updatedBy } = req.body;
    const result = await Content.findOneAndUpdate(
      { type: req.params.type },
      { $set: { data, updatedBy, lastUpdated: Date.now() } },
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Progress service running on port ${PORT}`);
});
