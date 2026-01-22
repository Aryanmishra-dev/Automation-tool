import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample RSS feeds
  const feeds = [
    {
      url: 'https://techcrunch.com/feed/',
      title: 'TechCrunch',
      description: 'Technology news and analysis',
      category: 'technology',
      isActive: true,
    },
    {
      url: 'https://www.theverge.com/rss/index.xml',
      title: 'The Verge',
      description: 'Technology, science, art, and culture',
      category: 'technology',
      isActive: true,
    },
    {
      url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
      title: 'Ars Technica',
      description: 'Tech news and IT trends',
      category: 'technology',
      isActive: true,
    },
    {
      url: 'https://www.wired.com/feed/rss',
      title: 'WIRED',
      description: 'Technology and culture',
      category: 'technology',
      isActive: true,
    },
    {
      url: 'https://hnrss.org/frontpage',
      title: 'Hacker News',
      description: 'Social news focusing on computer science',
      category: 'technology',
      isActive: true,
    },
    {
      url: 'https://blog.google/rss/',
      title: 'Google Blog',
      description: 'Official Google announcements',
      category: 'technology',
      isActive: true,
    },
    {
      url: 'https://openai.com/news/rss.xml',
      title: 'OpenAI Blog',
      description: 'AI research and news',
      category: 'ai',
      isActive: true,
    },
  ];

  for (const feed of feeds) {
    await prisma.rssFeed.upsert({
      where: { url: feed.url },
      create: feed,
      update: feed,
    });
  }

  console.log(`✅ Created ${feeds.length} RSS feeds`);

  // Create sample settings
  const settings = [
    { key: 'posting.autoPublish', value: 'true', category: 'automation', description: 'Automatically publish scheduled posts' },
    { key: 'posting.requireApproval', value: 'false', category: 'automation', description: 'Require manual approval before publishing' },
    { key: 'posting.maxPostsPerDay', value: '6', category: 'limits', description: 'Maximum posts per day' },
    { key: 'posting.startHour', value: '9', category: 'schedule', description: 'Start hour for posting (24h format)' },
    { key: 'posting.endHour', value: '21', category: 'schedule', description: 'End hour for posting (24h format)' },
    { key: 'content.includeHashtags', value: 'true', category: 'content', description: 'Include hashtags in generated content' },
    { key: 'content.maxHashtags', value: '5', category: 'content', description: 'Maximum hashtags per post' },
    { key: 'content.tone', value: 'engaging', category: 'content', description: 'Content tone (professional, casual, engaging)' },
    { key: 'rss.fetchInterval', value: '30', category: 'feeds', description: 'RSS fetch interval in minutes' },
    { key: 'analytics.fetchInterval', value: '360', category: 'analytics', description: 'Analytics fetch interval in minutes' },
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      create: setting,
      update: setting,
    });
  }

  console.log(`✅ Created ${settings.length} settings`);

  // Create some sample trends
  const trends = [
    { keyword: 'artificial intelligence', score: 95, source: 'manual' },
    { keyword: 'machine learning', score: 88, source: 'manual' },
    { keyword: 'automation', score: 75, source: 'manual' },
    { keyword: 'productivity', score: 70, source: 'manual' },
    { keyword: 'startup', score: 65, source: 'manual' },
    { keyword: 'innovation', score: 60, source: 'manual' },
  ];

  for (const trend of trends) {
    await prisma.trend.upsert({
      where: { keyword: trend.keyword },
      create: trend,
      update: trend,
    });
  }

  console.log(`✅ Created ${trends.length} sample trends`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
