import Parser from 'rss-parser';
import logger from '../utils/logger';

interface FeedItem {
  title: string;
  content: string;
  link: string;
  pubDate?: string;
}

export class RssAggregatorService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async fetchFeed(url: string): Promise<FeedItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      
      return feed.items.map((item) => ({
        title: item.title || '',
        content: item.contentSnippet || item.content || '',
        link: item.link || '',
        pubDate: item.pubDate,
      }));
    } catch (error) {
      logger.error(`Error fetching feed ${url}:`, error);
      throw error;
    }
  }

  async fetchMultipleFeeds(urls: string[]): Promise<FeedItem[]> {
    const results = await Promise.allSettled(
      urls.map((url) => this.fetchFeed(url))
    );

    return results
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => (result as PromiseFulfilledResult<FeedItem[]>).value);
  }
}
