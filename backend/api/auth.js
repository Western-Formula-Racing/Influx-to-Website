import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import User from '../db/models/user.js';
import mongoose from 'mongoose';

const router = express.Router();

// Login route
router.post('/login', [
    body('username').notEmpty(),
    body('password').notEmpty()
  ], async (req, res) => {
    try {
      console.log("Login request received:", req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { username, password } = req.body;
      console.log(`Looking for user: ${username}`);
      
      const user = await User.findOne({ username });
      console.log('User found:', user ? 'yes' : 'no');
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('Comparing passwords...');
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match: ${isMatch}`);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('Creating token...');
      const token = jwt.sign(
        { userId: user._id, role: user.role }, 
        process.env.JWT_SECRET || 'fallback_secret_for_testing',
        { expiresIn: '24h' }
      );
      
      console.log('Sending response...');
      return res.json({ 
        token, 
        user: { 
          id: user._id, 
          username: user.username, 
          role: user.role,
          permissions: user.permissions
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error during login' });
    }
});

  
// Register route
router.post('/register', [
  // ... validation rules ...
], authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // ... your registration code ...
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========= RACE TRACKING API ROUTES =========

// Race Schema
const raceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  trackPoints: [{
    x: Number,
    y: Number
  }],
  telemetryData: [{
    time: Number,
    speed: Number,
    batteryTemp: Number,
    position: {
      lat: Number,
      lon: Number
    }
  }]
});

// Create Race model if it doesn't exist
const Race = mongoose.models.Race || mongoose.model('Race', raceSchema);

// Get all races
router.get('/races', async (req, res) => {
  try {
    const races = await Race.find({}, 'name date');
    res.json(races);
  } catch (error) {
    console.error('Error fetching races:', error);
    res.status(500).json({ error: 'Failed to fetch races' });
  }
});

// Get a specific race
router.get('/races/:id', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json(race);
  } catch (error) {
    console.error('Error fetching race:', error);
    res.status(500).json({ error: 'Failed to fetch race' });
  }
});

// Create a new race
router.post('/races', async (req, res) => {
  try {
    const race = new Race(req.body);
    await race.save();
    res.status(201).json(race);
  } catch (error) {
    console.error('Error saving race:', error);
    res.status(500).json({ error: 'Failed to save race' });
  }
});

// Delete a race
router.delete('/races/:id', async (req, res) => {
  try {
    const race = await Race.findByIdAndDelete(req.params.id);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    res.json({ message: 'Race deleted successfully' });
  } catch (error) {
    console.error('Error deleting race:', error);
    res.status(500).json({ error: 'Failed to delete race' });
  }
});

export default router;