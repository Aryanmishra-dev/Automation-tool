import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.MIMO_API_KEY = 'test-api-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock Redis
vi.mock('bull', () => {
  const mockQueue = {
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    process: vi.fn(),
    on: vi.fn(),
    getWaitingCount: vi.fn().mockResolvedValue(0),
    getActiveCount: vi.fn().mockResolvedValue(0),
    getCompletedCount: vi.fn().mockResolvedValue(0),
    getFailedCount: vi.fn().mockResolvedValue(0),
    getDelayedCount: vi.fn().mockResolvedValue(0),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: vi.fn(() => mockQueue),
  };
});

// Mock external APIs
vi.mock('twitter-api-v2', () => ({
  TwitterApi: vi.fn(() => ({
    v2: {
      tweet: vi.fn().mockResolvedValue({ data: { id: 'tweet-123' } }),
      tweetMetrics: vi.fn().mockResolvedValue({
        data: { public_metrics: { like_count: 10, retweet_count: 5 } },
      }),
    },
  })),
}));

beforeAll(async () => {
  // Setup test database or mocks
  console.log('Test setup complete');
});

afterAll(async () => {
  // Cleanup
  console.log('Test cleanup complete');
});
