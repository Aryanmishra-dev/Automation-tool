import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { TrendAnalyzerService } from '../services/trend-analyzer.service';

const trendAnalyzer = new TrendAnalyzerService();

export async function getTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const trends = await prisma.trend.findMany({
      orderBy: { count: 'desc' },
      take: 50,
    });
    res.json(trends);
  } catch (error) {
    next(error);
  }
}

export async function getTopTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const trends = await prisma.trend.findMany({
      orderBy: { count: 'desc' },
      take: limit,
    });
    res.json(trends);
  } catch (error) {
    next(error);
  }
}

export async function analyzeTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = req.body;
    const trends = await trendAnalyzer.extractTrends(content);
    res.json(trends);
  } catch (error) {
    next(error);
  }
}
