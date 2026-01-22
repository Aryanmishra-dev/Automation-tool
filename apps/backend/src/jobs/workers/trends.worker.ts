import { trendsQueue } from '../queue';
import RssFeedService from '../../services/rss-feed.service';
import { NlpService } from '../../services/nlp.service';
import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();
const nlpService = new NlpService();

// Analyze trends job
trendsQueue.process('analyze-trends', async (job) => {
  logger.info('Starting trend analysis');

  try {
    // Update trends from RSS feeds
    await RssFeedService.updateTrendsFromFeeds();

    // Get all recent posts and analyze for additional trends
    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: { content: true },
    });

    // Extract keywords from posts
    const allKeywords: Map<string, number> = new Map();

    for (const post of recentPosts) {
      const keywords = nlpService.extractKeywords(post.content);
      for (const keyword of keywords) {
        const current = allKeywords.get(keyword.word) || 0;
        allKeywords.set(keyword.word, current + keyword.score);
      }
    }

    // Update trends in database
    for (const [keyword, score] of allKeywords.entries()) {
      await prisma.trend.upsert({
        where: { keyword },
        create: {
          keyword,
          score,
          source: 'content',
        },
        update: {
          score: { increment: score * 0.5 }, // Decay existing score
          updatedAt: new Date(),
        },
      });
    }

    // Clean up old trends (older than 7 days with low score)
    await prisma.trend.deleteMany({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        score: {
          lt: 1,
        },
      },
    });

    logger.info(`Analyzed ${allKeywords.size} keywords from ${recentPosts.length} posts`);

    return { 
      success: true, 
      keywordsAnalyzed: allKeywords.size,
      postsAnalyzed: recentPosts.length,
    };
  } catch (error) {
    logger.error('Trends worker error:', error);
    throw error;
  }
});

// Analyze specific content
trendsQueue.process('analyze-content', async (job) => {
  const { content } = job.data;
  
  try {
    logger.info('Analyzing trends from specific content');
    const keywords = nlpService.extractKeywords(content);
    
    return { success: true, keywords };
  } catch (error) {
    logger.error('Content trends analysis error:', error);
    throw error;
  }
});

logger.info('Trends worker started');
