import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  description: String,
  link: String,
  source: String,
  datePosted: String,
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

export const saveJobs = async (jobs) => {
  if (!Array.isArray(jobs)) return;
  for (const job of jobs) {
    // Avoid duplicates by link
    await Job.updateOne(
      { link: job.link },
      { $set: job },
      { upsert: true }
    );
  }
};

export default Job;
