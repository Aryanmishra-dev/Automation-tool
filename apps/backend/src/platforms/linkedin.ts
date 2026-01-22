import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export class LinkedInPublisher {
  private client: AxiosInstance | null = null;
  private accessToken: string = '';
  private profileId: string | null = null;
  private initialized = false;

  constructor() {
    // Lazy initialization
  }

  private initializeClient() {
    if (this.initialized) return;
    this.initialized = true;

    const config = require('../config').default;
    this.accessToken = config.platforms?.linkedin?.accessToken || '';
    
    if (!this.accessToken) {
      logger.warn('LinkedIn access token not configured');
      return;
    }

    this.client = axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
  }

  async initialize(): Promise<boolean> {
    this.initializeClient();
    
    if (!this.accessToken || !this.client) {
      logger.warn('LinkedIn access token not configured');
      return false;
    }

    try {
      const response = await this.client.get('/me');
      this.profileId = response.data.id;
      logger.info(`LinkedIn initialized for: ${response.data.localizedFirstName}`);
      return true;
    } catch (error) {
      logger.error('Failed to initialize LinkedIn:', error);
      return false;
    }
  }

  async publish(content: string, hashtags: string[] = []): Promise<LinkedInPostResult> {
    this.initializeClient();
    
    if (!this.profileId) {
      await this.initialize();
    }

    if (!this.profileId || !this.client) {
      return { success: false, error: 'LinkedIn not initialized' };
    }

    try {
      let postText = content;
      if (hashtags.length > 0) {
        postText += '\n\n' + hashtags.join(' ');
      }

      const postData = {
        author: `urn:li:person:${this.profileId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await this.client.post('/ugcPosts', postData);
      logger.info(`LinkedIn post published: ${response.data.id}`);
      
      return { success: true, postId: response.data.id };
    } catch (error: any) {
      logger.error('Error publishing to LinkedIn:', error.response?.data || error.message);
      return { success: false, error: error.message || 'Failed to publish' };
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    return {};
  }

  isConfigured(): boolean {
    this.initializeClient();
    return !!this.accessToken;
  }
}
