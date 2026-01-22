export interface FeedItem {
  title: string;
  content: string;
  link: string;
  pubDate?: string;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  message: string;
  postId?: string;
}

export interface TrendData {
  keyword: string;
  count: number;
  sentiment?: number;
  category?: string;
}

export interface AnalyticsData {
  likes: number;
  shares: number;
  comments: number;
  views: number;
  engagement: number;
}

// Platform constants and type
export const Platform = {
  TWITTER: 'TWITTER',
  LINKEDIN: 'LINKEDIN',
  INSTAGRAM: 'INSTAGRAM',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

// PostStatus constants and type
export const PostStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];
