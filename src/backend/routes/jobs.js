import express from 'express';
import { getJobs } from '../models/Job.js';

const router = express.Router();

// GET /api/jobs
// GET /api/jobs?keyword=...
router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    let query = { location: { $regex: /Montreal|Quebec/i } };
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query = {
        location: { $regex: /Montreal|Quebec/i },
        $or: [
          { title: regex },
          { description: regex },
          { company: regex },
        ],
      };
    }
    const jobs = await getJobs(query);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});


// POST /api/scrape - trigger all scrapers
import { startScrapers } from '../scrapers/index.js';
router.post('/scrape', async (req, res) => {
  try {
    // Start scraping asynchronously without awaiting
    startScrapers();
    res.json({ success: true, message: 'Scraping started.' });
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed to start', details: error.message });
  }
});

export default router;
