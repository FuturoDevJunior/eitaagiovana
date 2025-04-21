const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Exercise = require('../models/Exercise');

// POST /api/users - Cria um novo usuário
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    if (err.code === 11000) {
      // Username duplicado
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users - Lista todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/:_id/exercises - Adiciona exercício ao usuário
router.post('/:id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params.id;
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required and must be a non-empty string' });
    }
    const durationNum = Number(duration);
    if (!duration || isNaN(durationNum) || durationNum <= 0 || !Number.isInteger(durationNum)) {
      return res.status(400).json({ error: 'Duration is required and must be a positive integer' });
    }
    let exerciseDate;
    if (!date) {
      exerciseDate = new Date();
    } else {
      exerciseDate = new Date(date);
      if (isNaN(exerciseDate.getTime())) {
        return res.status(400).json({ error: 'Date is invalid' });
      }
    }
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const exercise = new Exercise({
      userId: user._id,
      description: description.trim(),
      duration: durationNum,
      date: exerciseDate
    });
    await exercise.save();
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:_id/logs - Log de exercícios do usuário
router.get('/:id/logs', async (req, res) => {
  try {
    const userId = req.params.id;
    const { from, to, limit } = req.query;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });
    let filter = { userId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    let query = Exercise.find(filter).select('description duration date -_id').sort({ date: 1 });
    if (limit) query = query.limit(Number(limit));
    const exercises = await query.exec();
    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 