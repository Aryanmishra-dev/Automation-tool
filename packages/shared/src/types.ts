export type Platform = 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface Post {
  id: string;
  title: string;
  content: string;
  platform: Platform;
  status: PostStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trend {
  id: string;
  keyword: string;
  count: number;
  category?: string;
  sentiment?: number;
  lastSeen: Date;
}

export interface Analytics {
  likes: number;
  shares: number;
  comments: number;
  views: number;
  engagement: number;
}
