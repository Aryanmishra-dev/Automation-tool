import config from './config';
import app from './app';
import logger from './utils/logger';
import { startWorkers, scheduleRecurringJobs, shutdownQueues } from './jobs/queue';

const PORT = config.port || 3000;

async function bootstrap() {
  try {
    // Start background workers (optional - can run separately with PM2)
    if (process.env.RUN_WORKERS !== 'false') {
      startWorkers();
      logger.info('Background workers started');

      // Schedule recurring jobs
      await scheduleRecurringJobs();
      logger.info('Recurring jobs scheduled');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await shutdownQueues();
          logger.info('All queues closed');
        } catch (error) {
          logger.error('Error closing queues:', error);
        }
        
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
