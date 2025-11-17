import mongoose from 'mongoose';
import { dbConnected } from '../config/db.js';

// In-memory storage for when DB is not available
let inMemoryJobs = [];

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  description: String,
  link: String,
  source: String,
  datePosted: String,
  salary: String,
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

export const saveJobs = async (jobs) => {
  if (!Array.isArray(jobs)) return;

  if (dbConnected) {
    // Use database
    for (const job of jobs) {
      // Avoid duplicates by link
      await Job.updateOne(
        { link: job.link },
        { $set: job },
        { upsert: true }
      );
    }
  } else {
    // Use in-memory storage
    for (const job of jobs) {
      // Avoid duplicates by link
      const existingIndex = inMemoryJobs.findIndex(j => j.link === job.link);
      if (existingIndex >= 0) {
        inMemoryJobs[existingIndex] = { ...job, _id: inMemoryJobs[existingIndex]._id };
      } else {
        inMemoryJobs.push({ ...job, _id: Date.now().toString() + Math.random() });
      }
    }
    console.log(`Saved ${jobs.length} jobs to memory (total: ${inMemoryJobs.length})`);
  }
};

export const getJobs = async (query = {}) => {
  if (dbConnected) {
    return await Job.find(query).sort({ createdAt: -1 }).limit(100);
  } else {
    // Filter in-memory jobs
    let filteredJobs = inMemoryJobs;
    if (query.$or) {
      filteredJobs = inMemoryJobs.filter(job =>
        query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const regex = condition[field];
          return regex.test(job[field] || '');
        })
      );
    }
    // Sort by createdAt (simulate with _id for now)
    filteredJobs.sort((a, b) => (b._id > a._id ? 1 : -1));
    return filteredJobs.slice(0, 100);
  }
};

export default Job;
