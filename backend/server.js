import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import doctorsRouter from './routes/doctors.js';
import usersRouter from './routes/users.js';
import clinicsRouter from './routes/clinics.js';
import analyticsRouter from './routes/analytics.js';
import adminUsersRouter from './routes/adminUsers.js';
import superAdminsRouter from './routes/superAdmins.js';
import authRouter from './routes/auth.js';
import pool from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://65.2.172.252:5174',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/super-admins', superAdminsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/users', usersRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin-users', adminUsersRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      message: 'Server and database are running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://65.2.172.252:5174'}`);
  console.log(`📦 Database: ${process.env.DB_HOST || 'Not configured'}`);
});
