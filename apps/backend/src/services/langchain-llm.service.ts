import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import config from '../config';
import logger from '../utils/logger';

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM';

type TopicInput =
  | string
  | {
      title?: string;
      description?: string;
      content?: string;
    };

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  platform: Platform;
}

export class LangChainLLMService {
  private model: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    // Initialize with OpenRouter API (OpenAI-compatible)
    this.model = new ChatOpenAI({
      openAIApiKey: config.api.openrouterApiKey,
      modelName: config.api.openrouterModel,
      temperature: 0.7,
      maxTokens: 1024,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    this.outputParser = new StringOutputParser();
  }

  /**
   * Generate platform-specific social media content
   */
  async generateContent(
    topic: TopicInput,
    platform: Platform,
    context?: string
  ): Promise<GeneratedContent> {
    const normalizedPlatform = this.normalizePlatform(platform);
    const topicText = this.normalizeTopic(topic);

    const prompts = {
      twitter: ChatPromptTemplate.fromMessages([
        ['system', `You are a social media expert creating engaging Twitter posts.
Keep posts under 280 characters. Be concise, engaging, and include relevant hashtags.
Use emojis sparingly but effectively. Make the content shareable and conversational.`],
        ['user', `Create a Twitter post about: {topic}
${context ? 'Context: {context}' : ''}
Include 2-3 relevant hashtags at the end.`],
      ]),
      
      linkedin: ChatPromptTemplate.fromMessages([
        ['system', `You are a professional content creator for LinkedIn.
Write professional, insightful posts that provide value to business professionals.
Use a professional yet approachable tone. Posts should be 100-200 words.
Include a call-to-action and relevant hashtags.`],
        ['user', `Create a LinkedIn post about: {topic}
${context ? 'Context: {context}' : ''}
Include 3-5 relevant hashtags at the end.`],
      ]),
      
      instagram: ChatPromptTemplate.fromMessages([
        ['system', `You are an Instagram content creator.
Write engaging captions that work well with visual content.
Use a friendly, authentic tone. Include emojis naturally.
Posts should be 100-150 words with a hook in the first line.`],
        ['user', `Create an Instagram caption about: {topic}
${context ? 'Context: {context}' : ''}
Include 5-10 relevant hashtags at the end.`],
      ]),
    };

    try {
      const chain = prompts[normalizedPlatform].pipe(this.model).pipe(this.outputParser);
      
      const result = await chain.invoke({
        topic: topicText,
        context: context || '',
      });

      // Extract hashtags from the response
      const hashtagMatches = result.match(/#\w+/g) || [];
      const hashtags = [...new Set(hashtagMatches)];

      // Remove hashtags from content for cleaner storage
      const contentWithoutHashtags = result
        .replace(/#\w+/g, '')
        .trim()
        .replace(/\s+/g, ' ');

      return {
        content: contentWithoutHashtags,
        hashtags,
        platform: normalizedPlatform,
      };
    } catch (error) {
      logger.error(`Error generating ${normalizedPlatform} content:`, error);
      const fallback = this.buildFallbackContent(topicText, normalizedPlatform);
      const fallbackTags = this.generateFallbackHashtags(topicText, normalizedPlatform);

      return {
        content: fallback,
        hashtags: fallbackTags,
        platform: normalizedPlatform,
      };
    }
  }

  private normalizePlatform(platform: Platform): 'twitter' | 'linkedin' | 'instagram' {
    const value = platform.toLowerCase();
    if (value === 'twitter' || value === 'linkedin' || value === 'instagram') {
      return value;
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  private normalizeTopic(topic: TopicInput): string {
    if (typeof topic === 'string') {
      return topic;
    }
    return [topic.title, topic.description, topic.content]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private buildFallbackContent(topic: string, platform: 'twitter' | 'linkedin' | 'instagram') {
    const base = topic ? `Topic: ${topic}` : 'A new update just dropped.';
    if (platform === 'twitter') {
      return `${base} #AI #Tech`;
    }
    if (platform === 'linkedin') {
      return `${base}

Key takeaway: stay curious and keep iterating. What’s your take?`;
    }
    return `${base}

What do you think? ✨`;
  }

  private generateFallbackHashtags(topic: string, platform: 'twitter' | 'linkedin' | 'instagram') {
    const words = topic
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, platform === 'instagram' ? 8 : 4)
      .map((w) => `#${w.replace(/[^a-z0-9]/g, '')}`)
      .filter((w) => w.length > 1);

    const defaults = platform === 'linkedin' ? ['#innovation', '#product'] : ['#ai', '#tech'];
    return Array.from(new Set([...words, ...defaults])).slice(0, platform === 'instagram' ? 10 : 5);
  }

  /**
   * Generate content for all platforms at once
   */
  async generateMultiPlatformContent(
    topic: string,
    context?: string
  ): Promise<Record<Platform, GeneratedContent>> {
    const platforms: Platform[] = ['twitter', 'linkedin', 'instagram'];
    
    const results = await Promise.all(
      platforms.map(platform => this.generateContent(topic, platform, context))
    );

    return {
      twitter: results[0],
      linkedin: results[1],
      instagram: results[2],
    };
  }

  /**
   * Improve existing content
   */
  async improveContent(content: string, platform: Platform): Promise<string> {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert at improving social media content for ${platform}.
Enhance the content to be more engaging while maintaining the original message.
Keep platform-specific best practices in mind.`],
      ['user', `Improve this ${platform} post:\n\n{content}`],
    ]);

    try {
      const chain = prompt.pipe(this.model).pipe(this.outputParser);
      return await chain.invoke({ content });
    } catch (error) {
      logger.error('Error improving content:', error);
      throw error;
    }
  }

  /**
   * Generate a summary of an article for social sharing
   */
  async summarizeForSocial(
    articleContent: string,
    platform: Platform
  ): Promise<GeneratedContent> {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a content curator who creates engaging social media posts from articles.
Summarize the key points in a way that's perfect for ${platform}.
Make it shareable and include a hook to encourage clicks.`],
      ['user', `Create a ${platform} post summarizing this article:\n\n{article}`],
    ]);

    try {
      const chain = prompt.pipe(this.model).pipe(this.outputParser);
      const result = await chain.invoke({
        article: articleContent.substring(0, 2000), // Limit context
      });

      const hashtagMatches = result.match(/#\w+/g) || [];
      
      return {
        content: result.replace(/#\w+/g, '').trim(),
        hashtags: [...new Set(hashtagMatches)],
        platform,
      };
    } catch (error) {
      logger.error('Error summarizing for social:', error);
      throw error;
    }
  }

  /**
   * Generate hashtag suggestions
   */
  async suggestHashtags(topic: string, count: number = 10): Promise<string[]> {
    const prompt = PromptTemplate.fromTemplate(
      `Generate ${count} relevant and trending hashtags for the topic: {topic}
Return only the hashtags, one per line, starting with #.`
    );

    try {
      const chain = prompt.pipe(this.model).pipe(this.outputParser);
      const result = await chain.invoke({ topic });
      
      const hashtags = result
        .split('\n')
        .filter(line => line.startsWith('#'))
        .map(tag => tag.trim());

      return hashtags.slice(0, count);
    } catch (error) {
      logger.error('Error suggesting hashtags:', error);
      return [];
    }
  }
}
