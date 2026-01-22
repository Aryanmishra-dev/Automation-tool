import logger from '../utils/logger';
import { LLMService } from './llm.service';

export type Platform = 'twitter' | 'linkedin' | 'instagram';

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  platform: Platform;
}

/**
 * Deprecated: Gemini LLM Service.
 * This wrapper now delegates to the OpenRouter-backed LLMService.
 */
export class GeminiLLMService {
  private llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async generateContent(prompt: string, context?: string): Promise<string> {
    return this.llm.generateContent(prompt, context);
  }

  async generateSocialContent(
    topic: string,
    platform: Platform,
    context?: string
  ): Promise<GeneratedContent> {
    const platformPrompts = {
      twitter: `You are a social media expert creating engaging Twitter posts.
Keep posts under 280 characters. Be concise, engaging, and include relevant hashtags.
Use emojis sparingly but effectively. Make the content shareable and conversational.

Create a Twitter post about: ${topic}
${context ? `Context: ${context}` : ''}
Include 2-3 relevant hashtags at the end.`,

      linkedin: `You are a professional content creator for LinkedIn.
Write professional, insightful posts that provide value to business professionals.
Use a professional yet approachable tone. Posts should be 100-200 words.
Include a call-to-action and relevant hashtags.

Create a LinkedIn post about: ${topic}
${context ? `Context: ${context}` : ''}
Include 3-5 relevant hashtags at the end.`,

      instagram: `You are an Instagram content creator.
Write engaging captions that work well with visual content.
Use a friendly, authentic tone. Include emojis naturally.
Posts should be 100-150 words with a hook in the first line.

Create an Instagram caption about: ${topic}
${context ? `Context: ${context}` : ''}
Include 5-10 relevant hashtags at the end.`,
    };

    try {
      const result = await this.llm.generateContent(platformPrompts[platform]);

      const hashtagMatches = result.match(/#\w+/g) || [];
      const hashtags = [...new Set(hashtagMatches)];

      const contentWithoutHashtags = result
        .replace(/#\w+/g, '')
        .trim()
        .replace(/\s+/g, ' ');

      return {
        content: contentWithoutHashtags,
        hashtags,
        platform,
      };
    } catch (error) {
      logger.error(`Error generating ${platform} content:`, error);
      throw error;
    }
  }
}
