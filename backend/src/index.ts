import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import authRoutes from './routes/auth';
import organizationRoutes from './routes/organizations';
import accountingRoutes from './routes/accounting';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', message: 'Accounting Backend is running.' });
});

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/organizations', '/organizations'], organizationRoutes);
app.use(['/api/accounting', '/accounting'], accountingRoutes);
app.use(['/api/users', '/users'], userRoutes);

const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyflowlabs_accounting';

mongoose.connect(mongodbUri).then(() => {
  console.log('[🌱] Connected to MongoDB Accounting database successfully.');
  app.listen(PORT, () => {
    console.log(`[🚀] Accounting Portal Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('[❌] MongoDB connection error:', err);
});
