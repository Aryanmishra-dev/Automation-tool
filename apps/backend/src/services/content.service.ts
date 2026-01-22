import { PrismaClient } from '@prisma/client';
import { Platform, PostStatus } from '../types';
import { ArticleExtractorService, ExtractedArticle } from './article-extractor.service';
import { NLPService } from './nlp.service';
import { LangChainLLMService } from './langchain-llm.service';
import logger from '../utils/logger';

interface GeneratedContent {
  platform: Platform;
  content: string;
  hashtags: string[];
  mediaUrl?: string;
}

interface ContentGenerationOptions {
  platforms: Platform[];
  tone?: 'professional' | 'casual' | 'engaging' | 'informative';
  includeHashtags?: boolean;
  maxHashtags?: number;
}

export class ContentService {
  private prisma: PrismaClient;
  private articleExtractor: ArticleExtractorService;
  private nlpService: NLPService;
  private llmService: LangChainLLMService;

  constructor() {
    this.prisma = new PrismaClient();
    this.articleExtractor = new ArticleExtractorService();
    this.nlpService = new NLPService();
    this.llmService = new LangChainLLMService();
  }

  /**
   * Generate social media content from a URL
   */
  async generateFromUrl(
    url: string,
    options: ContentGenerationOptions
  ): Promise<GeneratedContent[]> {
    try {
      // 1. Extract article content
      logger.info(`Extracting content from: ${url}`);
      const article = await this.articleExtractor.extract(url);

      if (!article) {
        throw new Error('Failed to extract article content');
      }

      // 2. Check for duplicate/similar content
      const isDuplicate = await this.checkDuplicate(article);
      if (isDuplicate) {
        logger.warn(`Duplicate content detected for: ${url}`);
        throw new Error('Similar content already exists');
      }

      // 3. Extract keywords for hashtags
      const keywords = this.nlpService.extractKeywords(article.content || article.description || '');
      logger.info(`Extracted ${keywords.length} keywords`);

      // 4. Generate content for each platform
      const results: GeneratedContent[] = [];

      for (const platform of options.platforms) {
        const content = await this.generateForPlatform(article, platform, {
          keywords,
          tone: options.tone,
          includeHashtags: options.includeHashtags,
          maxHashtags: options.maxHashtags,
        });
        results.push(content);
      }

      return results;
    } catch (error) {
      logger.error('Content generation error:', error);
      throw error;
    }
  }

  /**
   * Generate content for a specific platform
   */
  private async generateForPlatform(
    article: ExtractedArticle,
    platform: Platform,
    options: {
      keywords: Array<{ word: string; score: number }>;
      tone?: string;
      includeHashtags?: boolean;
      maxHashtags?: number;
    }
  ): Promise<GeneratedContent> {
    const context = {
      title: article.title,
      description: article.description || '',
      content: article.content?.slice(0, 2000) || '', // Limit content for LLM
      author: article.author,
      source: article.url,
    };

    // Generate platform-specific content using LLM
    const generated = await this.llmService.generateContent(context, platform);

    // Generate hashtags from keywords
    let hashtags: string[] = [];
    if (options.includeHashtags !== false) {
      const maxTags = options.maxHashtags || (platform === 'INSTAGRAM' ? 15 : 5);
      hashtags = options.keywords
        .slice(0, maxTags)
        .map((k) => `#${k.word.replace(/\s+/g, '')}`)
        .filter((tag) => tag.length <= 30);
    }

    return {
      platform,
      content: generated.content,
      hashtags,
      mediaUrl: article.image || undefined,
    };
  }

  /**
   * Check if similar content already exists
   */
  private async checkDuplicate(article: ExtractedArticle): Promise<boolean> {
    // Get recent posts
    const recentPosts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        content: true,
        title: true,
      },
    });

    const articleText = `${article.title} ${article.description || ''}`;

    for (const post of recentPosts) {
      const postText = `${post.title || ''} ${post.content}`;
      const similarity = this.nlpService.calculateSimilarity(articleText, postText);

      if (similarity > 0.7) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create posts from generated content
   */
  async createPosts(
    generatedContent: GeneratedContent[],
    options: {
      scheduledFor?: Date;
      status?: PostStatus;
      sourceUrl?: string;
    } = {}
  ) {
    const posts = [];

    for (const content of generatedContent) {
      const post = await this.prisma.post.create({
        data: {
          title: '', // Will be set if needed
          content: content.content,
          platform: content.platform,
          status: options.status || PostStatus.DRAFT,
          scheduledFor: options.scheduledFor,
          hashtags: JSON.stringify(content.hashtags || []),
          mediaUrl: content.mediaUrl,
          sourceUrl: options.sourceUrl,
        },
      });
      posts.push(post);
    }

    return posts;
  }

  /**
   * Improve existing content using LLM
   */
  async improveContent(
    postId: string,
    instructions: string
  ): Promise<{ content: string; hashtags: string[] }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const improved = await this.llmService.improveContent(
      post.content,
      post.platform,
      instructions
    );

    // Re-extract keywords for new hashtags
    const keywords = this.nlpService.extractKeywords(improved.content);
    const hashtags = keywords
      .slice(0, 10)
      .map((k) => `#${k.word.replace(/\s+/g, '')}`);

    return {
      content: improved.content,
      hashtags,
    };
  }

  /**
   * Generate content from trending topics
   */
  async generateFromTrends(
    platforms: Platform[],
    limit: number = 3
  ): Promise<GeneratedContent[]> {
    const trends = await this.prisma.trend.findMany({
      orderBy: { score: 'desc' },
      take: limit,
    });

    if (trends.length === 0) {
      throw new Error('No trends available');
    }

    const results: GeneratedContent[] = [];

    for (const platform of platforms) {
      const trendKeywords = trends.map((t) => t.keyword);
      
      const generated = await this.llmService.generateTrendContent(
        trendKeywords,
        platform
      );

      results.push({
        platform,
        content: generated.content,
        hashtags: trendKeywords.map((k) => `#${k.replace(/\s+/g, '')}`),
      });
    }

    return results;
  }

  /**
   * Get content suggestions based on analytics
   */
  async getContentSuggestions(): Promise<{
    bestPostingTimes: { hour: number; engagement: number }[];
    topPerformingHashtags: string[];
    recommendedTopics: string[];
  }> {
    // Analyze past performance
    const analytics = await this.prisma.analytics.findMany({
      include: { post: true },
      orderBy: { engagement: 'desc' },
      take: 50,
    });

    // Find best posting times
    const hourlyEngagement: Record<number, { total: number; count: number }> = {};
    const hashtagCounts: Record<string, number> = {};

    for (const analytic of analytics) {
      if (analytic.post.publishedAt) {
        const hour = new Date(analytic.post.publishedAt).getHours();
        if (!hourlyEngagement[hour]) {
          hourlyEngagement[hour] = { total: 0, count: 0 };
        }
        hourlyEngagement[hour].total += analytic.engagement;
        hourlyEngagement[hour].count += 1;
      }

      // Count hashtags
      const hashtags = analytic.post.hashtags as string[] || [];
      for (const tag of hashtags) {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + analytic.engagement;
      }
    }

    const bestPostingTimes = Object.entries(hourlyEngagement)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        engagement: data.total / data.count,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    const topPerformingHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    // Get trending topics as recommendations
    const trends = await this.prisma.trend.findMany({
      orderBy: { score: 'desc' },
      take: 10,
    });
    const recommendedTopics = trends.map((t) => t.keyword);

    return {
      bestPostingTimes,
      topPerformingHashtags,
      recommendedTopics,
    };
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

export default new ContentService();
