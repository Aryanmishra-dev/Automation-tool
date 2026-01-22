import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalPosts, publishedPosts, scheduledPosts, totalEngagement] = await Promise.all([
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
    ]);

    res.json({
      totalPosts,
      publishedPosts,
      scheduledPosts,
      totalEngagement,
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
