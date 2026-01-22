import { IgApiClient } from 'instagram-private-api';
import { readFileSync } from 'fs';
import logger from '../utils/logger';

export interface InstagramPostResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

export class InstagramPublisher {
  private ig: IgApiClient;
  private isLoggedIn: boolean = false;
  private initialized = false;

  constructor() {
    this.ig = new IgApiClient();
  }

  private getCredentials() {
    const config = require('../config').default;
    return config.platforms?.instagram || {};
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return this.isLoggedIn;
    this.initialized = true;

    const { username, password } = this.getCredentials();

    if (!username || !password) {
      logger.warn('Instagram credentials not configured');
      return false;
    }

    try {
      this.ig.state.generateDevice(username);
      await this.ig.account.login(username, password);
      this.isLoggedIn = true;
      logger.info(`Instagram logged in as: ${username}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to initialize Instagram:', error.message);
      return false;
    }
  }

  async publish(
    imagePath: string,
    caption: string,
    hashtags: string[] = []
  ): Promise<InstagramPostResult> {
    if (!this.isLoggedIn) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Instagram not initialized' };
      }
    }

    try {
      const imageBuffer = readFileSync(imagePath);

      let fullCaption = caption;
      if (hashtags.length > 0) {
        fullCaption += '\n\n' + hashtags.join(' ');
      }

      const publishResult = await this.ig.publish.photo({
        file: imageBuffer,
        caption: fullCaption,
      });

      logger.info(`Instagram post published: ${publishResult.media.id}`);
      return { success: true, mediaId: publishResult.media.id };
    } catch (error: any) {
      logger.error('Error publishing to Instagram:', error.message);
      
      if (error.name === 'IgActionSpamError') {
        return { success: false, error: 'Action blocked. Please wait.' };
      }

      return { success: false, error: error.message || 'Failed to publish' };
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    return {};
  }

  isConfigured(): boolean {
    const { username, password } = this.getCredentials();
    return !!username && !!password;
  }
}
