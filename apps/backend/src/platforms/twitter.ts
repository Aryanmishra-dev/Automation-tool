import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2';
import logger from '../utils/logger';

export interface TweetResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export class TwitterPublisher {
  private client: TwitterApiReadWrite | null = null;
  private initialized = false;

  constructor() {
    // Lazy initialization - don't initialize in constructor
  }

  private initializeClient() {
    if (this.initialized) return;
    this.initialized = true;

    // Dynamic import of config to avoid circular dependencies
    const config = require('../config').default;
    
    const { apiKey, apiSecret, accessToken, accessSecret } = config.platforms?.twitter || {};

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      logger.warn('Twitter credentials not configured');
      return;
    }

    try {
      const userClient = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      this.client = userClient.readWrite;
      logger.info('Twitter client initialized');
    } catch (error) {
      logger.error('Failed to initialize Twitter client:', error);
    }
  }

  async publish(content: string, hashtags: string[] = []): Promise<TweetResult> {
    this.initializeClient();
    
    if (!this.client) {
      return { success: false, error: 'Twitter client not initialized' };
    }

    try {
      let tweet = content;
      const hashtagString = hashtags.join(' ');
      
      // Ensure total length is under 280 characters
      const maxContentLength = 280 - hashtagString.length - 2;
      if (tweet.length > maxContentLength) {
        tweet = tweet.substring(0, maxContentLength - 3) + '...';
      }
      
      if (hashtags.length > 0) {
        tweet = `${tweet}\n\n${hashtagString}`;
      }

      const result = await this.client.v2.tweet(tweet);
      logger.info(`Tweet published: ${result.data.id}`);
      
      return { success: true, tweetId: result.data.id };
    } catch (error: any) {
      logger.error('Error publishing tweet:', error);
      
      if (error.code === 429) {
        return { success: false, error: 'Rate limit exceeded' };
      }

      return { success: false, error: error.message || 'Failed to publish tweet' };
    }
  }

  async getAnalytics(tweetId: string): Promise<any> {
    if (!this.client) return null;

    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics'],
      });

      return tweet.data.public_metrics;
    } catch (error) {
      logger.error(`Error fetching analytics for tweet ${tweetId}:`, error);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
