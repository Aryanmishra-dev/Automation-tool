import { Router, Request, Response, NextFunction } from 'express';
import { getQueueStats, addJob, clearRecurringJobs, scheduleRecurringJobs } from '../jobs/queue';
import logger from '../utils/logger';

const router = Router();

// Get queue statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getQueueStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Trigger RSS feed processing
router.post('/trigger/rss', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await addJob('rss', 'process-all-feeds', {});
    logger.info(`Triggered RSS processing job: ${job.id}`);
    
    res.json({
      success: true,
      message: 'RSS processing triggered',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
});

// Trigger content generation
router.post('/trigger/content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, platforms } = req.body;
    
    let job;
    if (url) {
      job = await addJob('content', 'generate-from-url', { url, platforms });
    } else {
      job = await addJob('content', 'generate-content', {});
    }
    
    logger.info(`Triggered content generation job: ${job.id}`);
    
    res.json({
      success: true,
      message: 'Content generation triggered',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
});

// Trigger trends analysis
router.post('/trigger/trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await addJob('trends', 'analyze-trends', {});
    logger.info(`Triggered trends analysis job: ${job.id}`);
    
    res.json({
      success: true,
      message: 'Trends analysis triggered',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
});

// Trigger scheduled posts publishing
router.post('/trigger/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await addJob('publisher', 'publish-scheduled', {});
    logger.info(`Triggered scheduled publishing job: ${job.id}`);
    
    res.json({
      success: true,
      message: 'Scheduled publishing triggered',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
});

// Trigger analytics fetch
router.post('/trigger/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await addJob('analytics', 'fetch-analytics', {});
    logger.info(`Triggered analytics fetch job: ${job.id}`);
    
    res.json({
      success: true,
      message: 'Analytics fetch triggered',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
});

// Retry failed posts
router.post('/trigger/retry-failed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxRetries } = req.body;
    const job = await addJob('publisher', 'retry-failed', { maxRetries: maxRetries || 3 });
    logger.info(`Triggered retry failed posts job: ${job.id}`);
    
    res.json({
      success: true,
      message: 'Retry failed posts triggered',
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
});

// Reset recurring jobs
router.post('/reset-recurring', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await clearRecurringJobs();
    await scheduleRecurringJobs();
    
    logger.info('Recurring jobs reset');
    
    res.json({
      success: true,
      message: 'Recurring jobs reset successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
