import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import { ArticleExtractorService } from './article-extractor.service';
import { NLPService } from './nlp.service';
import logger from '../utils/logger';

interface FeedItem {
  id: string;
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  creator?: string;
  categories?: string[];
}

interface ProcessedFeedItem extends FeedItem {
  keywords: Array<{ word: string; score: number }>;
  sentiment?: number;
  relevanceScore: number;
}

export class RssFeedService {
  private prisma: PrismaClient;
  private parser: Parser;
  private articleExtractor: ArticleExtractorService;
  private nlpService: NLPService;

  constructor() {
    this.prisma = new PrismaClient();
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Social-Bot-RSS-Reader/1.0',
      },
    });
    this.articleExtractor = new ArticleExtractorService();
    this.nlpService = new NLPService();
  }

  /**
   * Fetch and process a single feed
   */
  async fetchFeed(feedId: string): Promise<ProcessedFeedItem[]> {
    const feed = await this.prisma.rssFeed.findUnique({
      where: { id: feedId },
    });

    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    if (!feed.isActive) {
      logger.info(`Skipping inactive feed: ${feed.title}`);
      return [];
    }

    try {
      logger.info(`Fetching feed: ${feed.url}`);
      const parsedFeed = await this.parser.parseURL(feed.url);

      // Update last fetched timestamp
      await this.prisma.rssFeed.update({
        where: { id: feedId },
        data: { lastFetched: new Date() },
      });

      // Process items
      const processedItems: ProcessedFeedItem[] = [];

      for (const item of parsedFeed.items.slice(0, 10)) {
        const processed = await this.processItem(item as FeedItem, feed.category);
        if (processed) {
          processedItems.push(processed);
        }
      }

      // Sort by relevance
      processedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

      logger.info(`Processed ${processedItems.length} items from ${feed.title}`);
      return processedItems;
    } catch (error) {
      logger.error(`Error fetching feed ${feed.url}:`, error);
      throw error;
    }
  }

  /**
   * Process a single feed item
   */
  private async processItem(
    item: FeedItem,
    category?: string | null
  ): Promise<ProcessedFeedItem | null> {
    try {
      const text = `${item.title} ${item.contentSnippet || item.content || ''}`;

      // Extract keywords
      const keywords = this.nlpService.extractKeywords(text);

      // Calculate relevance score based on keywords and category match
      let relevanceScore = keywords.reduce((sum, k) => sum + k.score, 0) / keywords.length || 0;

      // Boost score if category matches
      if (category && item.categories) {
        const categoryMatch = item.categories.some(
          (c) => c.toLowerCase().includes(category.toLowerCase())
        );
        if (categoryMatch) {
          relevanceScore *= 1.5;
        }
      }

      return {
        ...item,
        id: item.link, // Use link as unique ID
        keywords,
        relevanceScore,
      };
    } catch (error) {
      logger.error(`Error processing item ${item.link}:`, error);
      return null;
    }
  }

  /**
   * Fetch all active feeds
   */
  async fetchAllFeeds(): Promise<ProcessedFeedItem[]> {
    const feeds = await this.prisma.rssFeed.findMany({
      where: { isActive: true },
    });

    const allItems: ProcessedFeedItem[] = [];

    for (const feed of feeds) {
      try {
        const items = await this.fetchFeed(feed.id);
        allItems.push(...items);
      } catch (error) {
        logger.error(`Error fetching feed ${feed.id}:`, error);
      }
    }

    // Remove duplicates based on URL similarity
    const uniqueItems = this.deduplicateItems(allItems);

    // Sort by relevance
    uniqueItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return uniqueItems;
  }

  /**
   * Remove duplicate items based on content similarity
   */
  private deduplicateItems(items: ProcessedFeedItem[]): ProcessedFeedItem[] {
    const unique: ProcessedFeedItem[] = [];

    for (const item of items) {
      const isDuplicate = unique.some((existing) => {
        const similarity = this.nlpService.calculateSimilarity(
          existing.title,
          item.title
        );
        return similarity > 0.8;
      });

      if (!isDuplicate) {
        unique.push(item);
      }
    }

    return unique;
  }

  /**
   * Get top items for content generation
   */
  async getTopItems(limit: number = 5): Promise<ProcessedFeedItem[]> {
    const items = await this.fetchAllFeeds();
    return items.slice(0, limit);
  }

  /**
   * Update trends from feed items
   */
  async updateTrendsFromFeeds(): Promise<void> {
    const items = await this.fetchAllFeeds();

    // Aggregate keywords across all items
    const keywordScores: Record<string, { score: number; count: number }> = {};

    for (const item of items) {
      for (const keyword of item.keywords) {
        if (!keywordScores[keyword.word]) {
          keywordScores[keyword.word] = { score: 0, count: 0 };
        }
        keywordScores[keyword.word].score += keyword.score * item.relevanceScore;
        keywordScores[keyword.word].count += 1;
      }
    }

    // Update or create trends
    for (const [keyword, data] of Object.entries(keywordScores)) {
      const score = data.score / data.count;

      await this.prisma.trend.upsert({
        where: { keyword },
        create: {
          keyword,
          score,
          source: 'rss',
        },
        update: {
          score,
          updatedAt: new Date(),
        },
      });
    }

    logger.info(`Updated ${Object.keys(keywordScores).length} trends from RSS feeds`);
  }

  /**
   * Add a new feed
   */
  async addFeed(url: string, title?: string, category?: string) {
    // Validate feed URL by trying to parse it
    const parsedFeed = await this.parser.parseURL(url);

    return this.prisma.rssFeed.create({
      data: {
        url,
        title: title || parsedFeed.title || 'Untitled Feed',
        description: parsedFeed.description,
        category,
        isActive: true,
      },
    });
  }

  /**
   * Remove a feed
   */
  async removeFeed(feedId: string) {
    return this.prisma.rssFeed.delete({
      where: { id: feedId },
    });
  }

  /**
   * Toggle feed active status
   */
  async toggleFeed(feedId: string, isActive: boolean) {
    return this.prisma.rssFeed.update({
      where: { id: feedId },
      data: { isActive },
    });
  }

  /**
   * Get all feeds
   */
  async getAllFeeds() {
    return this.prisma.rssFeed.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

export default new RssFeedService();
