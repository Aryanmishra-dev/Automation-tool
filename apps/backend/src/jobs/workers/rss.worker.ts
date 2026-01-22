import { rssQueue } from '../queue';
import RssFeedService from '../../services/rss-feed.service';
import ContentService from '../../services/content.service';
import { PrismaClient } from '@prisma/client';
import { Platform } from '../../types';
import logger from '../../utils/logger';
import config from '../../config';

const prisma = new PrismaClient();

// Process all feeds job
rssQueue.process('process-all-feeds', async (job) => {
  logger.info('Starting RSS feed processing for all feeds');

  try {
    // Fetch and process all feeds
    const topItems = await RssFeedService.getTopItems(config.posting.maxPostsPerDay);

    logger.info(`Found ${topItems.length} top items from RSS feeds`);

    // Generate content for each item
    let generatedCount = 0;
    const platforms: Platform[] = [Platform.TWITTER, Platform.LINKEDIN, Platform.INSTAGRAM];

    for (const item of topItems.slice(0, 3)) { // Limit to top 3 items per run
      try {
        const generated = await ContentService.generateFromUrl(item.link, {
          platforms,
          tone: 'engaging',
          includeHashtags: true,
        });

        await ContentService.createPosts(generated, {
          sourceUrl: item.link,
        });

        generatedCount += generated.length;
        logger.info(`Generated ${generated.length} posts from: ${item.title}`);
      } catch (error) {
        logger.error(`Failed to generate content for ${item.link}:`, error);
      }
    }

    // Update trends from feed data
    await RssFeedService.updateTrendsFromFeeds();

    return { success: true, itemsProcessed: topItems.length, postsGenerated: generatedCount };
  } catch (error) {
    logger.error('RSS feed processing error:', error);
    throw error;
  }
});

// Process single feed job
rssQueue.process('process-feed', async (job) => {
  const { feedId } = job.data;

  try {
    const items = await RssFeedService.fetchFeed(feedId);
    logger.info(`Processed ${items.length} items from feed ${feedId}`);
    return { success: true, itemsProcessed: items.length };
  } catch (error) {
    logger.error(`RSS worker error for feed ${feedId}:`, error);
    throw error;
  }
});

logger.info('RSS worker started');
