import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { startScrapers } from './scrapers/index.js';
import { connectDB } from './config/db.js';
import jobRoutes from './routes/jobs.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/jobs', jobRoutes);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  // Start the scrapers
  startScrapers();
};

startServer();