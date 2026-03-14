import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { apiRoutes } from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { connectToDatabase, closeDatabaseConnection } from './config/database';
import { ServiceContainer } from './config/serviceContainer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Proto Super User Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server function
const startServer = async () => {
  try {
    console.log('🚀 Starting Proto Super User Service...');
    
    // 1. Connect to MongoDB
    console.log('📊 Connecting to database...');
    await connectToDatabase();
    
    // 2. Initialize all services
    console.log('🔧 Initializing services...');
    const serviceContainer = ServiceContainer.getInstance();
    await serviceContainer.initialize();
    
    // 3. Start the server
    app.listen(PORT, () => {
      console.log('\n✅ Server startup complete!');
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 API Documentation:`);
      console.log(`   Users: http://localhost:${PORT}/api/users`);
      console.log(`   Chats: http://localhost:${PORT}/api/chats`);
      console.log(`   Models: http://localhost:${PORT}/api/models/openai`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  const serviceContainer = ServiceContainer.getInstance();
  await serviceContainer.shutdown();
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  const serviceContainer = ServiceContainer.getInstance();
  await serviceContainer.shutdown();
  await closeDatabaseConnection();
  process.exit(0);
});

export default app; 