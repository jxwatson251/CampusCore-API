import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import gradeRoutes from './routes/gradeRoutes';
import studentSelfServiceRoutes from './routes/studentSelfServiceRoutes';

const app: Application = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/student', studentSelfServiceRoutes); // Student self-service routes

app.get('/', (req, res) => {
  res.send('Campus Core API is running');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Campus Core API'
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set');
  console.error('Please create a .env file in your project root with:');
  console.error('MONGO_URI=mongodb://localhost:27017/campuscore');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set');
  console.error('Please create a .env file in your project root with:');
  console.error('JWT_SECRET=your-secret-key-here');
  process.exit(1);
}

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`👥 Student endpoints: http://localhost:${PORT}/api/students`);
      console.log(`📊 Grade endpoints: http://localhost:${PORT}/api/grades`);
      console.log(`🎓 Student self-service: http://localhost:${PORT}/api/student`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  })