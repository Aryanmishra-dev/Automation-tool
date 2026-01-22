/**
 * Standalone worker process for background job processing
 * This runs separately from the main API server for better resource management
 */

import config from '../config';
import { connectRedis } from '../config/redis';
import logger from '../utils/logger';

// Import workers
import './workers/rss.worker';
import './workers/trends.worker';
import './workers/content.worker';
import './workers/publisher.worker';

async function startWorkerProcess() {
  logger.info('Starting worker process...');

  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected for workers');

    logger.info('All workers are running');
    logger.info(`Environment: ${config.nodeEnv}`);

    // Keep the process alive
    process.on('SIGTERM', () => {
      logger.info('Worker process received SIGTERM, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('Worker process received SIGINT, shutting down gracefully');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start worker process:', error);
    process.exit(1);
  }
}

startWorkerProcess();
