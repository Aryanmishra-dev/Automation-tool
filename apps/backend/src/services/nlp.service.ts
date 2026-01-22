import nlp from 'compromise';
import natural from 'natural';
import stringSimilarity from 'string-similarity';
import logger from '../utils/logger';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

export interface KeywordResult {
  word: string;
  keyword?: string;
  score: number;
  type: 'topic' | 'entity' | 'hashtag';
}

export interface SimilarityResult {
  similarity: number;
  isSimilar: boolean;
}

export class NLPService {
  private tfidf: natural.TfIdf;
  private stopWords: Set<string>;

  constructor() {
    this.tfidf = new TfIdf();
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    ]);
  }

  /**
   * Extract keywords and topics from text using Compromise NLP
   */
  extractKeywords(text: string, limit: number = 10): KeywordResult[] {
    if (!text || !text.trim()) {
      return [];
    }

    const doc = nlp(text);
    const results: KeywordResult[] = [];

    // Extract topics/nouns
    const topics = doc.topics().out('array') as string[];
    topics.forEach((topic, index) => {
      const word = topic.toLowerCase();
      results.push({
        word,
        keyword: word,
        score: 1 - (index * 0.1),
        type: 'topic',
      });
    });

    // Extract organizations, people, places
    const entities = [
      ...doc.organizations().out('array') as string[],
      ...doc.people().out('array') as string[],
      ...doc.places().out('array') as string[],
    ];

    entities.forEach((entity, index) => {
      const word = entity.toLowerCase();
      if (!results.some(r => r.word === word)) {
        results.push({
          word,
          keyword: word,
          score: 0.9 - (index * 0.05),
          type: 'entity',
        });
      }
    });

    // Extract hashtags from the text
    const hashtagMatches = text.match(/#\w+/g) || [];
    hashtagMatches.forEach((tag, index) => {
      const word = tag.toLowerCase();
      results.push({
        word,
        keyword: word,
        score: 0.8 - (index * 0.1),
        type: 'hashtag',
      });
    });

    // Sort by score and limit
    let finalResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (finalResults.length === 0) {
      const tokens = tokenizer
        .tokenize(text.toLowerCase())
        .filter((t) => t.length > 2 && !this.stopWords.has(t));

      const unique = Array.from(new Set(tokens)).slice(0, limit);
      finalResults = unique.map((word, index) => ({
        word,
        keyword: word,
        score: 0.5 - index * 0.02,
        type: 'topic',
      }));
    }

    return finalResults;
  }

  /**
   * Extract trending keywords using TF-IDF across multiple documents
   */
  extractTrendingKeywords(documents: string[], limit: number = 20): KeywordResult[] {
    // Reset TF-IDF
    this.tfidf = new TfIdf();

    // Add all documents
    documents.forEach((doc) => {
      this.tfidf.addDocument(doc.toLowerCase());
    });

    // Get keyword scores across all documents
    const keywordScores = new Map<string, number>();

    documents.forEach((_, docIndex) => {
      this.tfidf.listTerms(docIndex).forEach((item) => {
        if (
          item.term.length > 3 &&
          !this.stopWords.has(item.term) &&
          !/^\d+$/.test(item.term)
        ) {
          const currentScore = keywordScores.get(item.term) || 0;
          keywordScores.set(item.term, currentScore + item.tfidf);
        }
      });
    });

    // Convert to array and sort
    return Array.from(keywordScores.entries())
      .map(([keyword, score]) => ({
        word: keyword,
        keyword,
        score,
        type: 'topic' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Check text similarity using string-similarity library
   */
  checkSimilarity(text1: string, text2: string, threshold: number = 0.6): SimilarityResult {
    const similarity = stringSimilarity.compareTwoStrings(
      text1.toLowerCase(),
      text2.toLowerCase()
    );

    return {
      similarity,
      isSimilar: similarity >= threshold,
    };
  }

  /**
   * Find best matching text from a list
   */
  findBestMatch(target: string, candidates: string[]): {
    bestMatch: string;
    rating: number;
    index: number;
  } | null {
    if (candidates.length === 0) return null;

    const result = stringSimilarity.findBestMatch(target.toLowerCase(), 
      candidates.map(c => c.toLowerCase())
    );

    return {
      bestMatch: candidates[result.bestMatchIndex],
      rating: result.bestMatch.rating,
      index: result.bestMatchIndex,
    };
  }

  /**
   * Check if content is duplicate based on similarity threshold
   */
  isDuplicate(newContent: string, existingContents: string[], threshold: number = 0.7): boolean {
    for (const existing of existingContents) {
      const { isSimilar } = this.checkSimilarity(newContent, existing, threshold);
      if (isSimilar) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate hashtags from text
   */
  generateHashtags(text: string, count: number = 5): string[] {
    const keywords = this.extractKeywords(text, count * 2);
    
    return keywords
      .filter(k => k.type !== 'hashtag')
      .slice(0, count)
      .map(k => {
        // Convert keyword to hashtag format
        const tag = k.keyword
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        return `#${tag}`;
      });
  }

  /**
   * Analyze sentiment (basic)
   */
  analyzeSentiment(text: string): { score: number; label: 'positive' | 'negative' | 'neutral' } {
    const doc = nlp(text);
    
    // Count positive and negative words
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
      'love', 'best', 'happy', 'success', 'win', 'innovative', 'breakthrough'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 
      'fail', 'crisis', 'problem', 'issue', 'concern', 'risk', 'danger'];

    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 0.1;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 0.1;
    });

    // Clamp score between -1 and 1
    score = Math.max(-1, Math.min(1, score));

    return {
      score,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
    };
  }

  /**
   * Extract high-level topics from text
   */
  extractTopics(text: string): string[] {
    const keywords = this.extractKeywords(text, 10);
    const topics = keywords
      .filter((k) => k.type === 'topic')
      .map((k) => k.word);

    return Array.from(new Set(topics));
  }

  /**
   * Get sentiment score from -1 to 1
   */
  getSentiment(text: string): number {
    return this.analyzeSentiment(text).score;
  }

  /**
   * Calculate similarity between two texts
   */
  calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;

    const similarity = stringSimilarity.compareTwoStrings(
      text1.toLowerCase().trim(),
      text2.toLowerCase().trim()
    );

    return similarity < 0.05 ? 0 : similarity;
  }
}

// Alias for backwards compatibility
export const NlpService = NLPService;
