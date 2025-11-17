import mongoose from 'mongoose';

export let dbConnected = false;

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-job-scraper', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
    dbConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Continuing without database - using in-memory storage');
    dbConnected = false;
  }
};
