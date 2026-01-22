import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { RssAggregatorService } from '../services/rss-aggregator.service';

const rssAggregator = new RssAggregatorService();

export async function getAllFeeds(req: Request, res: Response, next: NextFunction) {
  try {
    const feeds = await prisma.rssFeed.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(feeds);
  } catch (error) {
    next(error);
  }
}

export async function createFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { url, title, description, category } = req.body;
    const feed = await prisma.rssFeed.create({
      data: { url, title, description, category },
    });
    res.status(201).json(feed);
  } catch (error) {
    next(error);
  }
}

export async function getFeedById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const feed = await prisma.rssFeed.findUnique({
      where: { id },
      include: { posts: true },
    });
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    res.json(feed);
  } catch (error) {
    next(error);
  }
}

export async function updateFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const feed = await prisma.rssFeed.update({
      where: { id },
      data: req.body,
    });
    res.json(feed);
  } catch (error) {
    next(error);
  }
}

export async function deleteFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.rssFeed.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function fetchFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const feed = await prisma.rssFeed.findUnique({ where: { id } });
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    const items = await rssAggregator.fetchFeed(feed.url);
    res.json({ success: true, itemsCount: items.length });
  } catch (error) {
    next(error);
  }
}
