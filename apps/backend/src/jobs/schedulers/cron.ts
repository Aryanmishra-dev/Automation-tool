import cron from 'node-cron';
import { rssQueue, publisherQueue } from '../queue';
import prisma from '../../config/database';
import logger from '../../utils/logger';

export function startCronJobs() {
  // Fetch RSS feeds every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Cron: Fetching RSS feeds');
    const feeds = await prisma.rssFeed.findMany({
      where: { isActive: true },
    });

    for (const feed of feeds) {
      await rssQueue.add({ feedId: feed.id });
    }
  });

  // Publish scheduled posts every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Cron: Checking for scheduled posts');
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(),
        },
      },
    });

    for (const post of scheduledPosts) {
      await publisherQueue.add({ postId: post.id });
    }
  });

  // Clean up old trends data (monthly)
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Cron: Cleaning up old trends');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    await prisma.trend.deleteMany({
      where: {
        lastSeen: {
          lt: oneMonthAgo,
        },
        count: {
          lt: 5,
        },
      },
    });
  });

  logger.info('Cron jobs scheduled');
}
