import { publisherQueue } from '../queue';
import PublisherService from '../../services/publisher.service';
import logger from '../../utils/logger';

// Publish scheduled posts job
publisherQueue.process('publish-scheduled', async (job) => {
  logger.info('Starting scheduled posts publishing');

  try {
    const results = await PublisherService.publishScheduledPosts();
    
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(`Published ${successful} posts, ${failed} failed`);

    return { 
      success: true, 
      published: successful,
      failed,
      results,
    };
  } catch (error) {
    logger.error('Scheduled publishing error:', error);
    throw error;
  }
});

// Publish single post job
publisherQueue.process('publish-post', async (job) => {
  const { postId } = job.data;
  
  try {
    logger.info(`Publishing post ${postId}`);
    const result = await PublisherService.publishPost(postId);
    
    return result;
  } catch (error) {
    logger.error(`Publisher worker error for post ${postId}:`, error);
    throw error;
  }
});

// Retry failed posts job
publisherQueue.process('retry-failed', async (job) => {
  const { maxRetries = 3 } = job.data;
  
  try {
    logger.info('Retrying failed posts');
    const results = await PublisherService.retryFailedPosts(maxRetries);
    
    return { 
      success: true, 
      retried: results.length,
      results,
    };
  } catch (error) {
    logger.error('Retry failed posts error:', error);
    throw error;
  }
});

logger.info('Publisher worker started');
