import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalPosts, publishedPosts, scheduledPosts, totalEngagement, platformCounts] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'SCHEDULED' } }),
      prisma.analytics.aggregate({
        _sum: {
          likes: true,
          shares: true,
          comments: true,
          views: true,
        },
      }),
      prisma.post.groupBy({
        by: ['platform'],
        _count: { id: true },
      }),
    ]);

    const totalLikes = totalEngagement._sum?.likes || 0;
    const totalShares = totalEngagement._sum?.shares || 0;
    const totalComments = totalEngagement._sum?.comments || 0;
    const totalViews = totalEngagement._sum?.views || 0;
    const totalInteractions = totalLikes + totalShares + totalComments;
    const engagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;

    // Calculate platform stats
    const platformStats = platformCounts.map((p) => ({
      platform: p.platform,
      posts: p._count.id,
      engagement: engagementRate, // Simplified - same engagement for now
    }));

    res.json({
      totalPosts,
      publishedPosts,
      scheduledPosts,
      totalLikes,
      totalShares,
      totalComments,
      totalViews,
      engagementRate,
      platformStats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    const analytics = await prisma.analytics.findUnique({
      where: { postId },
      include: { post: true },
    });
    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

export async function getPerformance(req: Request, res: Response, next: NextFunction) {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const posts = await prisma.post.findMany({
      where: {
        publishedAt: { gte: since },
        status: 'PUBLISHED',
      },
      include: { analytics: true },
    });

    res.json(posts);
  } catch (error) {
    next(error);
  }
}
