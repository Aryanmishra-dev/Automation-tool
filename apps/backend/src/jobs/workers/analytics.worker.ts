import { analyticsQueue } from '../queue';
import PublisherService from '../../services/publisher.service';
import logger from '../../utils/logger';

// Fetch analytics for all published posts
analyticsQueue.process('fetch-analytics', async (job) => {
  logger.info('Starting analytics fetch for all published posts');

  try {
    await PublisherService.fetchAllAnalytics();
    
    return { 
      success: true, 
      message: 'Analytics fetch completed',
    };
  } catch (error) {
    logger.error('Analytics fetch error:', error);
    throw error;
  }
});

// Fetch analytics for a single post
analyticsQueue.process('fetch-post-analytics', async (job) => {
  const { postId } = job.data;
  
  try {
    logger.info(`Fetching analytics for post ${postId}`);
    const analytics = await PublisherService.fetchPostAnalytics(postId);
    
    return { 
      success: true, 
      analytics,
    };
  } catch (error) {
    logger.error(`Analytics fetch error for post ${postId}:`, error);
    throw error;
  }
});

logger.info('Analytics worker started');
