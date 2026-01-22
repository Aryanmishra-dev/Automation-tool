import Queue from 'bull';
import config from '../config';
import logger from '../utils/logger';

// Create queues with Redis connection
const redisConfig = {
  redis: {
    host: config.redis.host || 'localhost',
    port: config.redis.port || 6379,
    password: config.redis.password || undefined,
  },
};

// Job queues for different tasks
export const rssQueue = new Queue('rss-processing', redisConfig);
export const trendsQueue = new Queue('trends-analysis', redisConfig);
export const contentQueue = new Queue('content-generation', redisConfig);
export const publisherQueue = new Queue('publishing', redisConfig);
export const analyticsQueue = new Queue('analytics-fetch', redisConfig);

// Configure queue settings
const defaultJobOptions = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

[rssQueue, trendsQueue, contentQueue, publisherQueue, analyticsQueue].forEach((queue) => {
  queue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed in queue ${queue.name}`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed in queue ${queue.name}:`, err.message);
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled in queue ${queue.name}`);
  });

  queue.on('error', (err) => {
    logger.error(`Queue ${queue.name} error:`, err.message);
  });
});

/**
 * Schedule recurring jobs
 */
export async function scheduleRecurringJobs() {
  logger.info('Scheduling recurring jobs...');

  // RSS feed processing - every 30 minutes
  await rssQueue.add(
    'process-all-feeds',
    {},
    {
      ...defaultJobOptions,
      repeat: { cron: '*/30 * * * *' },
      jobId: 'recurring-rss',
    }
  );

  // Trends analysis - every hour
  await trendsQueue.add(
    'analyze-trends',
    {},
    {
      ...defaultJobOptions,
      repeat: { cron: '0 * * * *' },
      jobId: 'recurring-trends',
    }
  );

  // Content generation - every 2 hours during posting hours
  await contentQueue.add(
    'generate-content',
    {},
    {
      ...defaultJobOptions,
      repeat: { cron: '0 */2 * * *' },
      jobId: 'recurring-content',
    }
  );

  // Publishing scheduled posts - every 5 minutes
  await publisherQueue.add(
    'publish-scheduled',
    {},
    {
      ...defaultJobOptions,
      repeat: { cron: '*/5 * * * *' },
      jobId: 'recurring-publish',
    }
  );

  // Analytics fetch - every 6 hours
  await analyticsQueue.add(
    'fetch-analytics',
    {},
    {
      ...defaultJobOptions,
      repeat: { cron: '0 */6 * * *' },
      jobId: 'recurring-analytics',
    }
  );

  logger.info('Recurring jobs scheduled');
}

/**
 * Clear all recurring jobs (useful for redeployment)
 */
export async function clearRecurringJobs() {
  const queues = [rssQueue, trendsQueue, contentQueue, publisherQueue, analyticsQueue];
  
  for (const queue of queues) {
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  logger.info('Cleared all recurring jobs');
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const queues = [
    { name: 'rss', queue: rssQueue },
    { name: 'trends', queue: trendsQueue },
    { name: 'content', queue: contentQueue },
    { name: 'publisher', queue: publisherQueue },
    { name: 'analytics', queue: analyticsQueue },
  ];

  const stats = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return {
        name,
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    })
  );

  return stats;
}

/**
 * Manually add a job to a queue
 */
export async function addJob(
  queueName: 'rss' | 'trends' | 'content' | 'publisher' | 'analytics',
  jobName: string,
  data: any,
  options?: any
) {
  const queues: Record<string, Queue.Queue> = {
    rss: rssQueue,
    trends: trendsQueue,
    content: contentQueue,
    publisher: publisherQueue,
    analytics: analyticsQueue,
  };

  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }

  return queue.add(jobName, data, { ...defaultJobOptions, ...options });
}

/**
 * Start all workers
 */
export function startWorkers() {
  logger.info('Starting background workers...');
  
  // Import and start workers
  require('./workers/rss.worker');
  require('./workers/trends.worker');
  require('./workers/content.worker');
  require('./workers/publisher.worker');
  require('./workers/analytics.worker');

  logger.info('All workers started');
}

/**
 * Gracefully shutdown queues
 */
export async function shutdownQueues() {
  logger.info('Shutting down queues...');
  
  const queues = [rssQueue, trendsQueue, contentQueue, publisherQueue, analyticsQueue];
  
  await Promise.all(queues.map((queue) => queue.close()));
  
  logger.info('All queues closed');
}
