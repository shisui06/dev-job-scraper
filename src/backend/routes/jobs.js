import express from 'express';
import Job from '../models/Job.js';

const router = express.Router();

// GET /api/jobs
// GET /api/jobs?keyword=...
router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    let query = {};
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query = {
        $or: [
          { title: regex },
          { description: regex },
          { company: regex },
        ],
      };
    }
    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});


// POST /api/scrape - trigger all scrapers
import { startScrapers } from '../scrapers/index.js';
router.post('/scrape', async (req, res) => {
  try {
    await startScrapers();
    res.json({ success: true, message: 'Scraping complete.' });
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
});

export default router;
