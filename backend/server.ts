import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import faqRoutes from './routes/faq.js';
import communityRoutes from './routes/community.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notification.js';

// Load environment variables (.env)
dotenv.config();

const app = express();

// Database connection middleware to ensure connection on each request lazily
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// 1. Dynamic CORS Configuration (Must be first to handle preflight requests!)
// Defines which frontend domains are allowed to communicate with this API
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://yaksha-faq-frontend.vercel.app'
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Check if the origin is in our whitelist or is a dynamic Vercel preview branch
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required to allow cookies/auth headers
}));

// 2. Security & Logging Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Adjusted to allow secure cross-origin API requests
}));
app.use(morgan('dev')); // Logs incoming HTTP requests to the console

// 3. Rate Limiting
// Prevents brute-force attacks and DDoS by capping requests per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 300,                 // Limit each IP to 300 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many admin requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/admin', adminLimiter);
app.use('/api/', apiLimiter);

// 4. Body Parsing
app.use(express.json()); // Parses incoming JSON payloads in the request body

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 6. Health Check Endpoint
// Useful for deployment platforms (like Vercel/AWS) to verify the server is alive
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const conn = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    if (conn === 'connected') {
      await mongoose.connection.db!.admin().ping();
      dbStatus = 'connected';
    }
  } catch {
    dbStatus = 'error';
  }
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    db: dbStatus,
    version: '0.1.0',
  });
});

// 7. Global Error Handler
// Catches unhandled errors across the app and standardizes the JSON response
app.use((err: { status?: number; message?: string; stack?: string }, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    // Only expose detailed stack traces in development mode for security
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// 8. Server Initialization
// Prevents direct listening in production if deployed as a serverless function (e.g., Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Yaksha FAQ Portal backend running on port ${PORT}`);
  });
}

// Export the app for testing or serverless handler wrapping
export default app;