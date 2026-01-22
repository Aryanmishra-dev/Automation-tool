import { contentQueue } from '../queue';
import ContentService from '../../services/content.service';
import RssFeedService from '../../services/rss-feed.service';
import { PrismaClient } from '@prisma/client';
import { Platform, PostStatus } from '../../types';
import logger from '../../utils/logger';
import config from '../../config';

const prisma = new PrismaClient();

// Generate content from RSS feeds
contentQueue.process('generate-content', async (_job) => {
  logger.info('Starting automatic content generation');

  try {
    // Check if we're within posting hours
    const currentHour = new Date().getHours();
    const { start, end } = config.posting.hours;
    
    if (currentHour < start || currentHour > end) {
      logger.info(`Outside posting hours (${start}-${end}), skipping content generation`);
      return { success: true, skipped: true, reason: 'Outside posting hours' };
    }

    // Check daily post limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayPostCount = await prisma.post.count({
      where: {
        createdAt: { gte: today },
        status: { in: [PostStatus.PUBLISHED, PostStatus.SCHEDULED] },
      },
    });

    if (todayPostCount >= config.posting.maxPostsPerDay) {
      logger.info(`Daily post limit reached (${config.posting.maxPostsPerDay}), skipping`);
      return { success: true, skipped: true, reason: 'Daily limit reached' };
    }

    // Get top items from feeds
    const topItems = await RssFeedService.getTopItems(3);

    if (topItems.length === 0) {
      logger.info('No items to process from RSS feeds');
      return { success: true, itemsProcessed: 0 };
    }

    const platforms: Platform[] = [Platform.TWITTER, Platform.LINKEDIN];
    let generatedCount = 0;

    for (const item of topItems.slice(0, 2)) {
      try {
        const generated = await ContentService.generateFromUrl(item.link, {
          platforms,
          tone: 'engaging',
          includeHashtags: true,
        });

        // Schedule posts for later
        const scheduledFor = new Date();
        scheduledFor.setHours(scheduledFor.getHours() + Math.floor(Math.random() * 4) + 1);

        await ContentService.createPosts(generated, {
          sourceUrl: item.link,
          status: PostStatus.SCHEDULED,
          scheduledFor,
        });

        generatedCount += generated.length;
        logger.info(`Generated ${generated.length} posts from: ${item.title}`);
      } catch (error) {
        logger.error(`Failed to generate content for ${item.link}:`, error);
      }
    }

    return { success: true, postsGenerated: generatedCount };
  } catch (error) {
    logger.error('Content generation error:', error);
    throw error;
  }
});

// Generate content from URL
contentQueue.process('generate-from-url', async (job) => {
  const { url, platforms, tone } = job.data;
  
  try {
    logger.info(`Generating content from URL: ${url}`);
    
    const generated = await ContentService.generateFromUrl(url, {
      platforms: platforms || [Platform.TWITTER, Platform.LINKEDIN],
      tone: tone || 'engaging',
      includeHashtags: true,
    });

    const posts = await ContentService.createPosts(generated, {
      sourceUrl: url,
    });

    return { success: true, posts };
  } catch (error) {
    logger.error('Content generation from URL error:', error);
    throw error;
  }
});

// Generate content from trends
contentQueue.process('generate-from-trends', async (job) => {
  const { platforms } = job.data;
  
  try {
    logger.info('Generating content from trending topics');
    
    const generated = await ContentService.generateFromTrends(
      platforms || [Platform.TWITTER, Platform.LINKEDIN],
      5
    );

    const posts = await ContentService.createPosts(generated);

    return { success: true, posts };
  } catch (error) {
    logger.error('Trend content generation error:', error);
    throw error;
  }
});

// Improve existing post content
contentQueue.process('improve-content', async (job) => {
  const { postId, instructions } = job.data;
  
  try {
    logger.info(`Improving content for post ${postId}`);
    
    const improved = await ContentService.improveContent(postId, instructions);

    // Update post
    await prisma.post.update({
      where: { id: postId },
      data: {
        content: improved.content,
        hashtags: JSON.stringify(improved.hashtags),
      },
    });

    return { success: true, postId, improved };
  } catch (error) {
    logger.error('Content improvement error:', error);
    throw error;
  }
});

logger.info('Content worker started');
