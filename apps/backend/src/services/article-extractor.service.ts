import { extract } from '@extractus/article-extractor';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export interface ExtractedArticle {
  title: string;
  content: string;
  description: string;
  author: string | null;
  publishedTime: string | null;
  image: string | null;
  url: string;
}

export class ArticleExtractorService {
  /**
   * Extract full article content from a URL using @extractus/article-extractor
   */
  async extractFromUrl(url: string): Promise<ExtractedArticle | null> {
    try {
      new URL(url);
    } catch {
      return null;
    }

    try {
      const article = await extract(url);
      
      if (!article) {
        logger.warn(`Could not extract article from ${url}`);
        return null;
      }

      return {
        title: article.title || '',
        content: article.content || '',
        description: article.description || '',
        author: article.author || null,
        publishedTime: article.published || null,
        image: article.image || null,
        url: url,
      };
    } catch (error) {
      logger.error(`Error extracting article from ${url}:`, error);
      return null;
    }
  }

  /**
   * Fallback extraction using Cheerio for sites that don't work with article-extractor
   */
  async extractWithCheerio(url: string): Promise<ExtractedArticle | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .ads, .advertisement').remove();

      // Extract content using common selectors
      const title = $('h1').first().text() || $('title').text() || '';
      const description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content') || 
                    $('article img').first().attr('src') || null;
      const author = $('meta[name="author"]').attr('content') || 
                     $('.author').first().text() || null;

      // Try to get main content
      let content = '';
      const contentSelectors = ['article', '.article-content', '.post-content', 'main', '.content'];
      
      for (const selector of contentSelectors) {
        const el = $(selector);
        if (el.length && el.text().length > 100) {
          content = el.text().trim();
          break;
        }
      }

      // Fallback to paragraphs
      if (!content) {
        content = $('p').map((_, el) => $(el).text()).get().join('\n\n');
      }

      return {
        title: title.trim(),
        content: content.trim(),
        description: description.trim(),
        author: author?.trim() || null,
        publishedTime: null,
        image,
        url,
      };
    } catch (error) {
      logger.error(`Error extracting with Cheerio from ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract article with fallback
   */
  async extract(url: string): Promise<ExtractedArticle | null> {
    try {
      new URL(url);
    } catch {
      return null;
    }

    // Try article-extractor first
    let article = await this.extractFromUrl(url);
    
    // Fallback to Cheerio if extraction failed or content is too short
    if (!article || article.content.length < 100) {
      logger.info(`Falling back to Cheerio extraction for ${url}`);
      article = await this.extractWithCheerio(url);
    }

    return article;
  }

  /**
   * Extract multiple articles in parallel
   */
  async extractBatch(urls: string[]): Promise<ExtractedArticle[]> {
    const results = await Promise.all(urls.map((url) => this.extract(url)));
    return results.filter((item): item is ExtractedArticle => Boolean(item));
  }
}
