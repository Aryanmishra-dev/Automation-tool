import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root (2 levels up from apps/backend)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
// Also try local .env as fallback
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  api: {
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openrouterModel: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
  },
  
  platforms: {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
    },
    instagram: {
      username: process.env.INSTAGRAM_USERNAME || '',
      password: process.env.INSTAGRAM_PASSWORD || '',
    },
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-minimum-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Job intervals in minutes
  jobs: {
    rss: parseInt(process.env.RSS_FETCH_INTERVAL_MINS || '30', 10),
    trends: parseInt(process.env.TREND_ANALYSIS_INTERVAL_MINS || '60', 10),
    content: parseInt(process.env.CONTENT_GENERATION_INTERVAL_MINS || '120', 10),
    publisher: parseInt(process.env.PUBLISH_CHECK_INTERVAL_MINS || '5', 10),
    analytics: parseInt(process.env.ANALYTICS_FETCH_INTERVAL_MINS || '360', 10),
  },

  posting: {
    hours: {
      start: parseInt(process.env.POSTING_HOURS_START || '9', 10),
      end: parseInt(process.env.POSTING_HOURS_END || '21', 10),
    },
    maxPostsPerDay: parseInt(process.env.MAX_POSTS_PER_DAY || '6', 10),
  },
} as const;

export default config;
