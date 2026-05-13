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
  progress: { type: Map, of: mongoose.Schema.Types.Mixed },
  lastUpdated: { type: Date, default: Date.now }
});

const Progress = mongoose.model('Progress', progressSchema);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
    const { email, name, progress } = req.body;
    const updateData = { email, name, lastUpdated: Date.now() };
    
    // Only update progress if it's explicitly provided in the request
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    const result = await Progress.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: updateData },
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
