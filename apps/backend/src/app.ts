import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { setupWebSocket } from './websocket/socket';
import { getQueueStats } from './jobs/queue';
import { createServer } from 'http';
import logger from './utils/logger';

const app: Application = express();
const httpServer = createServer(app);

// Setup WebSocket
setupWebSocket(httpServer);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      queues: queueStats,
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
});

// Ready check (for Kubernetes/Docker)
app.get('/ready', (req, res) => {
  res.json({ ready: true });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Cannot ${req.method} ${req.path}` 
  });
});

// Error handling
app.use(errorHandler);

export default httpServer;
