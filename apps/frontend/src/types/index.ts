export type Platform = 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface Post {
  id: string;
  title: string;
  content: string;
  platform: Platform;
  status: PostStatus;
  scheduledFor?: string;
  publishedAt?: string;
  sourceUrl?: string;
  mediaUrl?: string;
  hashtags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Trend {
  id: string;
  keyword: string;
  score: number;
  count?: number;
  category?: string;
  sentiment?: number;
  platform?: Platform;
  lastSeen: string;
  createdAt: string;
}

export interface Analytics {
  id: string;
  postId: string;
  platform: Platform;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  engagement: number;
  clicks?: number;
  impressions?: number;
  fetchedAt: string;
}

export interface Feed {
  id: string;
  url: string;
  title: string;
  description?: string;
  category?: string;
  isActive: boolean;
  lastFetched?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueItem {
  id: string;
  postId: string;
  post: Post;
  priority: number;
  scheduledFor: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}
