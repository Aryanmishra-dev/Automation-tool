import { PrismaClient } from '@prisma/client';
import { Platform, PostStatus } from '../types';
import { TwitterPublisher } from '../platforms/twitter';
import { LinkedInPublisher } from '../platforms/linkedin';
import { InstagramPublisher } from '../platforms/instagram';
import logger from '../utils/logger';

interface PublishResult {
  success: boolean;
  postId: string;
  platformPostId?: string;
  error?: string;
}

export class PublisherService {
  private prisma: PrismaClient;
  private twitter: TwitterPublisher;
  private linkedin: LinkedInPublisher;
  private instagram: InstagramPublisher;

  constructor() {
    this.prisma = new PrismaClient();
    this.twitter = new TwitterPublisher();
    this.linkedin = new LinkedInPublisher();
    this.instagram = new InstagramPublisher();
  }

  /**
   * Publish a post to its designated platform
   */
  async publishPost(postId: string): Promise<PublishResult> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return {
        success: false,
        postId,
        error: 'Post not found',
      };
    }

    if (post.status === PostStatus.PUBLISHED) {
      return {
        success: false,
        postId,
        error: 'Post already published',
      };
    }

    try {
      logger.info(`Publishing post ${postId} to ${post.platform}`);

      let platformPostId: string | undefined;
      const hashtagsArray = typeof post.hashtags === 'string' 
        ? JSON.parse(post.hashtags) 
        : (post.hashtags || []);

      switch (post.platform) {
        case Platform.TWITTER:
          platformPostId = await this.twitter.publish({
            content: post.content,
            mediaUrl: post.mediaUrl || undefined,
            hashtags: hashtagsArray,
          });
          break;

        case Platform.LINKEDIN:
          platformPostId = await this.linkedin.publish({
            content: post.content,
            mediaUrl: post.mediaUrl || undefined,
            hashtags: hashtagsArray,
          });
          break;

        case Platform.INSTAGRAM:
          if (!post.mediaUrl) {
            throw new Error('Instagram posts require an image');
          }
          platformPostId = await this.instagram.publish({
            content: post.content,
            mediaUrl: post.mediaUrl,
            hashtags: hashtagsArray,
          });
          break;

        default:
          throw new Error(`Unsupported platform: ${post.platform}`);
      }

      // Update post status
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
          platformPostId,
        },
      });

      logger.info(`Successfully published post ${postId}`);

      return {
        success: true,
        postId,
        platformPostId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to publish post ${postId}:`, error);

      // Update post status to failed
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.FAILED,
        },
      });

      return {
        success: false,
        postId,
        error: errorMessage,
      };
    }
  }

  /**
   * Publish posts to all platforms
   */
  async publishToAllPlatforms(
    content: string,
    options: {
      mediaUrl?: string;
      hashtags?: string[];
      scheduledFor?: Date;
    } = {}
  ): Promise<PublishResult[]> {
    const platforms: Platform[] = [Platform.TWITTER, Platform.LINKEDIN, Platform.INSTAGRAM];
    const results: PublishResult[] = [];

    for (const platform of platforms) {
      // Skip Instagram if no media
      if (platform === Platform.INSTAGRAM && !options.mediaUrl) {
        logger.info('Skipping Instagram - no media provided');
        continue;
      }

      // Create post
      const post = await this.prisma.post.create({
        data: {
          content,
          platform,
          status: options.scheduledFor ? PostStatus.SCHEDULED : PostStatus.DRAFT,
          scheduledFor: options.scheduledFor,
          mediaUrl: options.mediaUrl,
          hashtags: options.hashtags || [],
        },
      });

      // Publish immediately if not scheduled
      if (!options.scheduledFor) {
        const result = await this.publishPost(post.id);
        results.push(result);
      } else {
        results.push({
          success: true,
          postId: post.id,
        });
      }
    }

    return results;
  }

  /**
   * Publish scheduled posts that are due
   */
  async publishScheduledPosts(): Promise<PublishResult[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledFor: {
          lte: new Date(),
        },
      },
    });

    logger.info(`Found ${posts.length} scheduled posts to publish`);

    const results: PublishResult[] = [];

    for (const post of posts) {
      const result = await this.publishPost(post.id);
      results.push(result);

      // Add a small delay between posts to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Retry failed posts
   */
  async retryFailedPosts(maxRetries: number = 3): Promise<PublishResult[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.FAILED,
      },
    });

    logger.info(`Found ${posts.length} failed posts to retry`);

    const results: PublishResult[] = [];

    for (const post of posts) {
      // Reset status to allow retry
      await this.prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.DRAFT,
        },
      });

      const result = await this.publishPost(post.id);
      results.push(result);

      // Add delay between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }

  /**
   * Fetch analytics for a published post
   */
  async fetchPostAnalytics(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || !post.platformPostId) {
      throw new Error('Post not found or not published');
    }

    let analytics;

    switch (post.platform) {
      case Platform.TWITTER:
        analytics = await this.twitter.getAnalytics(post.platformPostId);
        break;

      case Platform.LINKEDIN:
        analytics = await this.linkedin.getAnalytics(post.platformPostId);
        break;

      case Platform.INSTAGRAM:
        analytics = await this.instagram.getAnalytics(post.platformPostId);
        break;

      default:
        throw new Error(`Unsupported platform: ${post.platform}`);
    }

    // Save analytics
    await this.prisma.analytics.upsert({
      where: { postId },
      create: {
        postId,
        platform: post.platform,
        ...analytics,
        fetchedAt: new Date(),
      },
      update: {
        ...analytics,
        fetchedAt: new Date(),
      },
    });

    return analytics;
  }

  /**
   * Fetch analytics for all published posts
   */
  async fetchAllAnalytics() {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        platformPostId: { not: null },
      },
    });

    for (const post of posts) {
      try {
        await this.fetchPostAnalytics(post.id);
      } catch (error) {
        logger.error(`Failed to fetch analytics for post ${post.id}:`, error);
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

export default new PublisherService();
