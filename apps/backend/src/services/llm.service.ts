import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import config from '../config';
import logger from '../utils/logger';

export class LLMService {
  private model: ChatOpenAI;
  private outputParser: StringOutputParser;

  constructor() {
    if (!config.api.openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    this.model = new ChatOpenAI({
      openAIApiKey: config.api.openrouterApiKey,
      modelName: config.api.openrouterModel,
      temperature: 0.7,
      maxTokens: 500,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    this.outputParser = new StringOutputParser();
  }

  async generateContent(prompt: string, context?: string): Promise<string> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      const result = await this.model.pipe(this.outputParser).invoke(fullPrompt);
      return result.trim();
    } catch (error) {
      logger.error('Error generating content with LLM:', error);
      return `Draft: ${prompt}`.slice(0, 500);
    }
  }

  async improveContent(content: string): Promise<string> {
    const prompt = `Improve the following social media post to make it more engaging and professional:\n\n${content}`;
    return this.generateContent(prompt);
  }

  async generateHashtags(content: string, count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} relevant hashtags for the following content. Return only the hashtags, one per line, starting with #:\n\n${content}`;
    const result = await this.generateContent(prompt);
    return result.split('\n').filter((tag) => tag.startsWith('#'));
  }
}
