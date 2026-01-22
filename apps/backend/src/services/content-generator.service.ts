import { LLMService } from './llm.service';
import { TrendAnalyzerService } from './trend-analyzer.service';
import logger from '../utils/logger';

export class ContentGeneratorService {
  private llmService: LLMService;
  private trendAnalyzer: TrendAnalyzerService;

  constructor() {
    this.llmService = new LLMService();
    this.trendAnalyzer = new TrendAnalyzerService();
  }

  async generatePost(topic: string, platform: string): Promise<string> {
    try {
      // Get trending topics for context
      const trends = await this.trendAnalyzer.getTopTrends(5);
      const trendKeywords = trends.map((t) => t.keyword).join(', ');

      const prompt = `Create an engaging ${platform} post about ${topic}. 
      Current trending topics: ${trendKeywords}.
      Make it concise, engaging, and include relevant hashtags.`;

      const content = await this.llmService.generateContent(prompt);
      return content;
    } catch (error) {
      logger.error('Error generating post:', error);
      throw error;
    }
  }

  async generateFromArticle(articleContent: string, platform: string): Promise<string> {
    const prompt = `Summarize the following article into an engaging ${platform} post with hashtags:\n\n${articleContent}`;
    return this.llmService.generateContent(prompt);
  }

  async improvePost(content: string): Promise<string> {
    return this.llmService.improveContent(content);
  }
}
