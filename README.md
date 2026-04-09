# Shortly — URL Shortener with Real-Time Analytics

A production-grade URL shortening service built to handle high-traffic scenarios at scale. Designed to learn and implement the core system design concepts every backend engineer needs to know.

## Live Demo
- **App:** https://url-shortener-peach-six.vercel.app
- **API:** https://url-shortener-ji04.onrender.com/health
- **GitHub:** https://github.com/ahmad4376/url-shortener

## What It Does

Users paste a long URL — a Google Form, a document, a product page — and get back a short link they can share anywhere. Every click is tracked in real time, and an analytics dashboard shows live activity as it happens. An optional AI feature generates meaningful, memorable slugs instead of random characters.

## Why I Built This

I wanted a single project that forced me to think beyond just "making it work." Most tutorials teach you to build features. This project taught me to think about *systems* — what happens when a link goes viral and thousands of people click it simultaneously? How do you count those clicks without slowing down the redirect? How do you keep data fresh without hammering your database?

Every architectural decision in this project was made to answer a real engineering question.

## The Hard Problem: High-Traffic Redirects

The core challenge was this: a short link shared during a major event could receive thousands of simultaneous clicks. A naive implementation — hit the database on every redirect — would collapse under that load.

**The solution:** A layered architecture where 99% of redirects never touch the database.

```
User clicks short link
        │
        ▼
   Check Redis Cache (~1ms)
        │
   ┌────┴────┐
   │         │
  HIT       MISS
   │         │
   │    Check MongoDB
   │         │
   │    Store in Redis
   │         │
   └────┬────┘
        │
        ▼
   Redirect instantly ✅

   (separately, in background)
        │
        ▼
   BullMQ Queue → Worker → MongoDB clicks++
   (user already redirected — doesn't wait for this)
```

First request: fetched from MongoDB, cached in Redis with 24hr TTL.
Every subsequent request: served from Redis in under 1ms.
Click counting: async via BullMQ — never blocks the redirect.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│     Landing Page + Auth + Dashboard + Real-time      │
│              Deployed on Vercel                      │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP / WebSocket
┌─────────────────────▼───────────────────────────────┐
│                  Express.js API                      │
│         (REST endpoints + Socket.io server)          │
│              Deployed on Render                      │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌────▼────────────────┐
│  MongoDB    │ │   Redis   │ │     BullMQ Worker   │
│  Atlas      │ │  (Cache + │ │  (Async click       │
│  (Primary   │ │  Queues)  │ │   processing)       │
│  Database)  │ └───────────┘ └─────────────────────┘
└─────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Node.js + Express | Non-blocking I/O handles concurrent redirects well |
| Frontend | Next.js + TypeScript | App Router, SSR, type safety |
| Database | MongoDB Atlas | Flexible schema, TTL indexes for auto-expiring links |
| Cache | Redis | In-memory, 50-100x faster than disk for hot URL lookups |
| Queue | BullMQ | Decouples click counting from redirect path |
| Real-time | Socket.io | WebSocket-based live analytics dashboard |
| Auth | JWT + API Keys | JWT for browser sessions, API keys for programmatic access |
| AI | OpenAI GPT-4o-mini | Generates meaningful slugs from URL content |
| Security | Helmet + CORS + Rate Limiting | Standard production security practices |
| Deploy | Docker + Vercel + Render | Containerized backend, CDN-hosted frontend |

## Key Engineering Decisions

### Cache-Aside Pattern
Redis sits in front of MongoDB for all redirect lookups. On a cache miss, the result is stored with a 24-hour TTL. On URL deactivation, the cache key is immediately invalidated — no stale redirects.

### Async Click Processing
Click counts are not written synchronously in the redirect handler. Instead, a job is enqueued to BullMQ and the user is redirected instantly. A background worker processes the queue and updates MongoDB. This decouples write throughput from redirect latency entirely.

### AI Slug Generation
When enabled, the URL is sent to OpenAI GPT-4o-mini which generates a short, descriptive, memorable slug based on the URL content. For example, `https://docs.react.dev/learn` becomes `react-docs-learn` instead of `x7km9p`. Falls back to random generation if the AI call fails — core functionality never depends on an optional enhancement.

### Dual Authentication
The API supports both JWT (for browser-based users) and API Keys (for programmatic/server-to-server access). A `flexAuth` middleware tries JWT first, falls back to API key — one middleware, two auth strategies.

### Rate Limiting with Redis Sliding Window
Auth routes are limited to 10 requests per 15 minutes (brute force protection). General API routes allow 100 requests per 15 minutes. Counts are stored in Redis — shared across all server instances, persistent across restarts.

### TTL Indexes for Auto-Expiring Links
MongoDB TTL indexes automatically delete expired URL documents at the exact expiry time — no cron jobs, no scheduled tasks, no extra code.

## Features

- **URL Shortening** — paste any URL, get a short link instantly
- **AI Smart Slugs** — optional AI-generated memorable slugs (e.g. `react-docs` instead of `x7km9p`)
- **Real-time Analytics** — live click count updates via WebSockets, no page refresh needed
- **Link Management** — activate, deactivate, delete links from your dashboard
- **Copy to Clipboard** — one-click copy of your short URL
- **Public API** — generate short URLs programmatically using API keys
- **Rate Limiting** — abuse protection on all endpoints
- **Auto-expiring Links** — set TTL on links, MongoDB deletes them automatically

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/generate-key` | JWT | Generate API key |

### URLs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/urls` | JWT or API Key | Create short URL |
| GET | `/api/urls` | JWT or API Key | Get all your URLs |
| PATCH | `/api/urls/:id` | JWT or API Key | Toggle active/inactive |
| DELETE | `/api/urls/:id` | JWT or API Key | Delete a URL |

### Redirects
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:slug` | Public | Redirect to long URL |

### Example API Usage
```bash
# Generate an API key (requires login first)
curl -X POST https://url-shortener-ji04.onrender.com/api/auth/generate-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a short URL with API key
curl -X POST https://url-shortener-ji04.onrender.com/api/urls \
  -H "x-api-key: sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://example.com", "useAI": true}'
```

## Running Locally

**Prerequisites:** Docker

```bash
git clone https://github.com/ahmad4376/url-shortener.git
cd url-shortener

# Add your environment variables
cp server/.env.example server/.env
# Fill in MONGODB_URI, JWT_SECRET, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, OPENAI_API_KEY

# Start the backend
docker compose up --build

# Start the frontend (separate terminal)
cd web
npm install
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## What I Learned

Building this project gave me hands-on experience with concepts I previously only understood theoretically:

- **Caching** is not just "make it faster" — it requires thinking about invalidation, TTL, and consistency tradeoffs
- **Message queues** decouple producers from consumers — the redirect handler doesn't care when the click gets counted, just that it will be
- **WebSockets** vs polling is a real engineering decision with measurable tradeoffs — I implemented both and benchmarked the difference
- **Rate limiting algorithms** (fixed window vs sliding window) have concrete exploitability differences, not just theoretical ones
- **JWT vs API keys** serve different use cases — browser sessions vs server-to-server — and a well-designed API supports both
- **AI as an enhancement** — wrapping AI features with fallbacks ensures core functionality never breaks

## Project Structure

```
url-shortener/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── redis.js          # Redis client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT + API key + flexAuth middleware
│   │   │   └── rateLimiter.js    # Redis-backed rate limiting
│   │   ├── models/
│   │   │   ├── User.js           # User schema + bcrypt hook
│   │   │   └── Url.js            # URL schema + indexes + TTL
│   │   ├── queues/
│   │   │   ├── clickQueue.js     # BullMQ queue definition
│   │   │   └── clickWorker.js    # Async click processor + Socket.io emit
│   │   ├── routes/
│   │   │   ├── auth.js           # Auth endpoints + API key generation
│   │   │   └── url.js            # URL CRUD + AI slug generation
│   │   └── index.js              # Express app + Socket.io + redirect route
│   ├── Dockerfile
│   └── .env.example
├── web/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Register page
│   │   └── dashboard/page.tsx    # Dashboard + real-time analytics
│   └── lib/
│       ├── api.ts                # Axios instance + interceptors
│       └── auth.ts               # Auth utilities
├── docker-compose.yml
└── README.md
```