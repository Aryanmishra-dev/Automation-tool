import prisma from '../config/database';
import logger from '../utils/logger';

export class TrendAnalyzerService {
  async extractTrends(content: string): Promise<string[]> {
    // Simple keyword extraction - can be enhanced with NLP
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4);

    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top keywords
    const trends = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Store trends in database
    await this.storeTrends(trends);

    return trends;
  }

  async storeTrends(keywords: string[]): Promise<void> {
    try {
      for (const keyword of keywords) {
        await prisma.trend.upsert({
          where: { keyword },
          update: {
            count: { increment: 1 },
            lastSeen: new Date(),
          },
          create: {
            keyword,
            count: 1,
          },
        });
      }
    } catch (error) {
      logger.error('Error storing trends:', error);
    }
  }

  async getTopTrends(limit: number = 10) {
    return prisma.trend.findMany({
      orderBy: { count: 'desc' },
      take: limit,
    });
  }
}
