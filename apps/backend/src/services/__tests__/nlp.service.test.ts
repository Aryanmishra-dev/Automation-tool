import { describe, it, expect } from 'vitest';
import { NlpService } from '../nlp.service';

describe('NlpService', () => {
  const nlpService = new NlpService();

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const text = 'Artificial intelligence and machine learning are transforming technology';
      const keywords = nlpService.extractKeywords(text);

      expect(keywords).toBeInstanceOf(Array);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords[0]).toHaveProperty('word');
      expect(keywords[0]).toHaveProperty('score');
    });

    it('should return empty array for empty text', () => {
      const keywords = nlpService.extractKeywords('');
      expect(keywords).toEqual([]);
    });

    it('should handle text with special characters', () => {
      const text = 'AI/ML is great! #Technology @user';
      const keywords = nlpService.extractKeywords(text);
      expect(keywords).toBeInstanceOf(Array);
    });

    it('should respect maxKeywords option', () => {
      const text = 'The quick brown fox jumps over the lazy dog near the river bank in the forest';
      const keywords = nlpService.extractKeywords(text, 3);
      expect(keywords.length).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      const similarity = nlpService.calculateSimilarity('hello world', 'hello world');
      expect(similarity).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = nlpService.calculateSimilarity('abc', 'xyz');
      expect(similarity).toBe(0);
    });

    it('should return value between 0 and 1 for similar strings', () => {
      const similarity = nlpService.calculateSimilarity(
        'machine learning',
        'machine learning algorithms'
      );
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('extractTopics', () => {
    it('should extract topics from text', () => {
      const text = 'Microsoft announced new AI features for Windows operating system';
      const topics = nlpService.extractTopics(text);

      expect(topics).toBeInstanceOf(Array);
    });
  });

  describe('getSentiment', () => {
    it('should return positive sentiment for positive text', () => {
      const text = 'This is amazing and wonderful news!';
      const sentiment = nlpService.getSentiment(text);

      expect(sentiment).toBeGreaterThanOrEqual(-1);
      expect(sentiment).toBeLessThanOrEqual(1);
    });

    it('should return negative sentiment for negative text', () => {
      const text = 'This is terrible and awful news!';
      const sentiment = nlpService.getSentiment(text);

      expect(sentiment).toBeLessThanOrEqual(1);
      expect(sentiment).toBeGreaterThanOrEqual(-1);
    });
  });
});
