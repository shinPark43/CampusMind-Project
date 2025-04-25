// routes/sports.js
//this is for my dropdown on the employee page
import express from 'express';
import { Sport } from '../models/sportModel.js'; // ✅ adjust path if needed

const router = express.Router();

router.get('/sports', async (req, res) => {
  try {
    const sports = await Sport.find({});
    res.status(200).json(sports);
  } catch (err) {
    console.error('Error fetching sports:', err);
    res.status(500).json({ error: 'Failed to fetch sports' });
  }
});

export default router;