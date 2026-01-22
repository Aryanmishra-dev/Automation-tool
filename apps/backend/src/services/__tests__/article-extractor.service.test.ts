import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleExtractorService } from '../article-extractor.service';

// Mock fetch
global.fetch = vi.fn();

describe('ArticleExtractorService', () => {
  let articleExtractor: ArticleExtractorService;

  beforeEach(() => {
    articleExtractor = new ArticleExtractorService();
    vi.clearAllMocks();
  });

  describe('extract', () => {
    it('should extract article content from a URL', async () => {
      // Mock the fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head><title>Test Article</title></head>
            <body>
              <article>
                <h1>Test Article Title</h1>
                <p>This is the article content with some text.</p>
              </article>
            </body>
          </html>
        `),
      });

      const result = await articleExtractor.extract('https://example.com/article');

      expect(result).toBeDefined();
      expect(result?.url).toBe('https://example.com/article');
    });

    it('should return null for invalid URL', async () => {
      const result = await articleExtractor.extract('not-a-valid-url');
      expect(result).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await articleExtractor.extract('https://example.com/error');
      expect(result).toBeNull();
    });
  });

  describe('extractBatch', () => {
    it('should extract multiple articles', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html><title>Article 1</title></html>'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html><title>Article 2</title></html>'),
        });

      const results = await articleExtractor.extractBatch([
        'https://example.com/1',
        'https://example.com/2',
      ]);

      expect(results).toBeInstanceOf(Array);
    });
  });
});
