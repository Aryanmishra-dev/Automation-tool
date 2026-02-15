# Automation Tool — Social Media Automation Platform

## Overview

A monorepo-based social media automation platform with scheduling, content management, and analytics capabilities. Built with Node.js backend and React frontend, featuring WebSocket real-time updates and Redis-backed job queues.

## Problem Statement

Automate repetitive social media management tasks:
- Post scheduling across platforms
- Content queue management
- Engagement analytics
- Real-time status updates via WebSockets

## Architecture

```
Automation-tool/
├── server/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, rate limiting, validation
│   │   ├── models/          # MongoDB/Mongoose schemas
│   │   ├── services/        # Business logic
│   │   ├── queues/          # Redis-backed job processing
│   │   ├── websocket/       # Real-time event system
│   │   └── config/          # Environment configuration
│   ├── tests/
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/      # React UI components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   └── store/           # State management
│   └── package.json
├── ecosystem.config.js      # PM2 process management
├── docker-compose.yml
└── package.json             # Monorepo root
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Frontend | React |
| Database | MongoDB |
| Queue | Redis + Bull |
| Real-time | WebSockets (Socket.io) |
| Process Management | PM2 |
| Auth | JWT |

## Setup Instructions

```bash
git clone https://github.com/Aryanmishra-dev/Automation-tool.git
cd Automation-tool

# Install dependencies
npm install          # Root dependencies
cd server && npm install
cd ../client && npm install
cd ..

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development
npm run dev          # Starts both server and client

# Or start individually
npm run dev:server
npm run dev:client
```

## Environment Variables

See `.env.example` for all required configuration:

```
MONGODB_URI=mongodb://localhost:27017/automation
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-a-strong-secret>
PORT=5000
CLIENT_URL=http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/posts` | List scheduled posts | Yes |
| POST | `/api/posts` | Create scheduled post | Yes |
| PUT | `/api/posts/:id` | Update post | Yes |
| DELETE | `/api/posts/:id` | Delete post | Yes |
| GET | `/api/analytics` | Get engagement metrics | Yes |
| WS | `/ws` | Real-time status updates | Yes |

## Testing

```bash
cd server
npm test
npm run test:coverage
```

## Limitations

1. **Single platform focus** — currently only supports one social media platform.
2. **No OAuth integration** — uses direct API credentials instead of proper OAuth flow.
3. **Limited error recovery** — failed jobs need manual retry.
4. **No rate limiting on API** — vulnerable to abuse.
5. **Basic analytics** — no time-series data or trend analysis.

## Future Improvements

- [ ] Add OAuth2 flow for platform authentication
- [ ] Implement proper rate limiting (express-rate-limit)
- [ ] Add retry logic with exponential backoff for failed jobs
- [ ] Multi-platform support (Twitter, LinkedIn, Instagram)
- [ ] Add comprehensive E2E tests
- [ ] Implement proper logging (Winston/Pino)
- [ ] Add Kubernetes deployment manifests
- [ ] Set up monitoring (Prometheus + Grafana)

## Lessons Learned

- **What went wrong:** The initial codebase was pushed in a single commit, which obscured the development process. The JWT secret had a hardcoded fallback, and some credentials were in config files rather than environment variables.
- **What I would improve:** Develop with feature branches from the start. Use a secrets manager or at minimum `.env` files from day one. Add input validation middleware before building any endpoint.
- **What I misunderstood at the time:** I didn't realize how critical proper secret management is — even a fallback default for a JWT secret is a security vulnerability. I also underestimated the importance of incremental commits for demonstrating development process.
- **How I would rebuild it today:** TypeScript throughout, proper OAuth2 flows, Bull queue with dead-letter handling, structured logging with correlation IDs, Docker Compose for local dev, Kubernetes for production, comprehensive integration tests, and feature-flag-based rollout.
