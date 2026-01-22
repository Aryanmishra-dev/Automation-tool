# Social Media Bot - AI-Powered Automated Content Creation & Publishing

An intelligent social media automation platform that aggregates RSS feeds, analyzes trends, generates content using AI (Google Gemini + LangChain), and publishes to multiple social media platforms simultaneously.

## 🎯 Project Goals

- **90%+ Posts Automated** - Minimal manual intervention
- **3-6 Posts Per Day** - Consistent publishing schedule
- **<10% Manual Edits** - High-quality AI-generated content
- **95%+ Availability** - Reliable background processing
- **<500ms Page Load** - Fast, responsive dashboard

## 🚀 Features

- **RSS Aggregation**: Automatically fetch and analyze content from multiple RSS feeds (every 30 minutes)
- **Trend Analysis**: Identify trending topics using NLP (Compromise + Natural) (every hour)
- **AI Content Generation**: Generate engaging posts using Google Gemini API + LangChain.js (every 2 hours)
- **Multi-Platform Publishing**: Publish to Twitter, LinkedIn, and Instagram simultaneously
- **Duplicate Detection**: String-similarity based content deduplication
- **Smart Scheduling**: Queue and schedule posts for optimal engagement times
- **Real-time Dashboard**: Monitor performance and analytics with React + TanStack Query
- **WebSocket Updates**: Live updates for post status and analytics
- **Process Management**: PM2 for production deployment

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + TanStack Query + Zustand
- **Backend**: Node.js 20 LTS + Express + TypeScript + Zod validation
- **Database**: SQLite + Prisma ORM (serverless, no setup required)
- **Queue**: Bull + Redis (background job processing)
- **AI/NLP**: Google Gemini API + LangChain.js + Compromise + Natural + string-similarity
- **Social APIs**: twitter-api-v2 + instagram-private-api + LinkedIn REST API
- **Real-time**: Socket.io
- **Testing**: Vitest
- **Process Manager**: PM2
- **Monorepo**: PNPM Workspaces

### System Flow
```
RSS Feeds → Article Extractor → NLP Processing → AI Content Generation → Platform Publishers
                                      ↓
                              Trend Analysis → Content Suggestions
```

## 📋 Prerequisites

- **Node.js** >= 20.0.0 (LTS recommended)
- **PNPM** >= 8.0.0
- **Redis** >= 6 (for job queue)
- **Mac Mini M4** (16GB RAM, 10-core CPU/GPU) - optimized for this hardware

## 🛠️ Installation

### 1. Clone and install dependencies:
```bash
cd Automation
pnpm install
```

### 2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Required
GEMINI_API_KEY=your_gemini_api_key   # From Google AI Studio
DATABASE_URL=file:./dev.db           # SQLite (auto-created)

# Social Platforms (add as needed)
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

LINKEDIN_CLIENT_ID=your_linkedin_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret

INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
```

### 3. Initialize database:
```bash
cd apps/backend
pnpm db:push        # Create tables
pnpm db:seed        # Add sample RSS feeds (optional)
```

### 4. Start Redis:
```bash
# macOS with Homebrew
brew install redis
brew services start redis
```

### 5. Start development:
```bash
# From root directory
pnpm dev
```

## 📦 Project Structure

```
Automation/
├── apps/
│   ├── backend/                 # Express API server
│   │   ├── prisma/              # Database schema & migrations
│   │   ├── src/
│   │   │   ├── config/          # Configuration
│   │   │   ├── controllers/     # Route handlers
│   │   │   ├── jobs/            # Bull queue workers
│   │   │   ├── middleware/      # Express middleware
│   │   │   ├── platforms/       # Social media publishers
│   │   │   ├── routes/          # API routes
│   │   │   ├── services/        # Business logic
│   │   │   └── websocket/       # Real-time updates
│   │   └── ecosystem.config.js  # PM2 configuration
│   └── frontend/                # React dashboard
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── hooks/           # TanStack Query hooks
│       │   ├── lib/             # Utilities
│       │   ├── pages/           # Page components
│       │   └── services/        # API client
│       └── vite.config.ts
├── packages/
│   └── shared/                  # Shared types and utilities
├── data/
│   ├── feeds/                   # RSS feed configurations
│   └── logs/                    # Application logs
└── scripts/                     # Setup and deployment scripts
```

## 🔧 Development Commands

```bash
# Start all apps in development mode
pnpm dev

# Build all apps for production
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## 🚀 Production Deployment

### Using PM2 (Recommended)
```bash
# Build the applications
pnpm build

# Start with PM2
cd apps/backend
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

### Manual Start
```bash
# Backend
cd apps/backend && pnpm start

# Frontend (separate terminal)
cd apps/frontend && pnpm preview
```

## 🌐 API Endpoints

### Backend API (http://localhost:3000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feeds` | GET, POST | Manage RSS feeds |
| `/api/posts` | GET, POST, PUT, DELETE | Post management |
| `/api/posts/:id/publish` | POST | Publish a post |
| `/api/trends` | GET | Trending topics |
| `/api/analytics` | GET | Analytics overview |
| `/api/content/generate` | POST | Generate content from URL |
| `/api/queue/stats` | GET | Queue statistics |
| `/api/queue/trigger/*` | POST | Trigger jobs manually |
| `/health` | GET | Health check with queue stats |

### Frontend Dashboard (http://localhost:5173)
- **Dashboard** - Overview with stats, recent posts, trends
- **Posts** - Manage and filter all posts
- **Queue** - View scheduled posts
- **Trends** - Explore trending topics
- **Analytics** - Performance metrics
- **Settings** - Configure API keys and automation
- Dashboard with real-time updates
- Post queue management
- Analytics and insights

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
