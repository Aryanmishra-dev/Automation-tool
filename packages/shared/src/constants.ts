export const PLATFORMS = {
  TWITTER: 'TWITTER',
  LINKEDIN: 'LINKEDIN',
  INSTAGRAM: 'INSTAGRAM',
} as const;

export const POST_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const;

export const API_ENDPOINTS = {
  FEEDS: '/api/feeds',
  POSTS: '/api/posts',
  TRENDS: '/api/trends',
  ANALYTICS: '/api/analytics',
  SETTINGS: '/api/settings',
} as const;
