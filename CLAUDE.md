# SwipeStay -- CLAUDE.md

This file provides context for Claude Code when working on the SwipeStay project.

## Project Overview

SwipeStay is a mobile-first platform (with web app support) for London students to find accommodation using a Tinder-style swipe interface. Students swipe through listings of flats, shared accommodation, and student halls. Swiping right (liking) reveals landlord/agent contact details. An automated web scraper sources listings and pushes them into user feeds.

## Architecture and Tech Stack

### Decided

- **Web Frontend**: Next.js with React and Tailwind CSS
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **Web Scraper**: Python with Playwright (browser automation) + BeautifulSoup (parsing) + Pydantic (validation). First source: SpareRoom. JSONL intermediate output, PostgreSQL ingestion via asyncpg.
- **Containerisation**: Docker + docker-compose for local development
- **CI/CD**: GitHub Actions

### To Be Decided

- **Mobile Framework**: React Native vs Flutter (leaning React Native for code sharing with web)
- **Backend**: Node.js (Express/Fastify) vs Python (FastAPI) -- if Python is chosen, the scraper and API share a runtime
- **Image Storage**: AWS S3 vs Cloudinary
- **Auth Provider**: Custom JWT vs Auth0/Clerk vs university SSO integration

## Key Directories

```
web/                        # Next.js web application (scaffolded, app router)
  src/app/                  # App router pages and layouts (/, /liked, /progress)
  src/components/           # UI components (SwipeCard, SwipeDeck, NoteModal, AppShell, BottomNav, PriceToggle, GalleryModal)
  src/data/                 # Mock data (mock-listings.ts) — delete when real API is connected
  src/lib/                  # Data fetching (listings.ts), state (store.tsx), pricing utils (pricing.ts)
  src/types/                # TypeScript type definitions (listing.ts)
mobile/                     # Mobile app (React Native or Flutter) [planned]
api/                        # Backend API server [planned]
  src/routes/               # Endpoint handlers
  src/models/               # Database models/schemas
  src/services/             # Business logic
  src/middleware/            # Auth, validation
  migrations/               # DB migrations
scraper/                     # Web scraping pipeline (Python, implemented)
  src/scraper/
    spiders/base.py          # Abstract base spider (Playwright browser management)
    spiders/spareroom.py     # SpareRoom spider (search + detail pages)
    parsers/spareroom.py     # SpareRoom HTML parsing (feature-list extraction)
    exporters/jsonl.py       # JSONL file export + reader
    exporters/postgres.py    # PostgreSQL upsert ingestion (asyncpg)
    utils/rate_limit.py      # Randomised delay between requests
    models.py                # Pydantic Listing schema (price in pence, monthly normalisation)
    config.py                # URLs, rate limits, defaults
    main.py                  # CLI entrypoint (click): scrape, preview commands
  data/raw/                  # JSONL output files (gitignored)
  tests/fixtures/            # Saved HTML for parser unit tests
shared/                      # Shared types, constants, validation schemas [planned]
```

## Development Guidelines

### Code Style

- TypeScript for all JS/TS code (strict mode enabled)
- Python code follows PEP 8; use type hints
- Use ESLint + Prettier for frontend/backend linting and formatting
- Use Ruff or Black for Python formatting

### Conventions

- API endpoints follow RESTful naming: `/api/v1/listings`, `/api/v1/users/:id/likes`
- Database tables use snake_case; TypeScript interfaces use PascalCase
- Environment variables go in `.env` (never committed); use `.env.example` as template
- All scraper spiders should implement a common base class for consistency

### Testing

- Write unit tests for business logic (services layer)
- Write integration tests for API endpoints
- Scraper tests should use fixture HTML files, not live requests
- Aim for meaningful coverage on critical paths: auth, swipe actions, listing ingestion
- Run tests with `npm test` (JS/TS) or `pytest` (Python)

### Git Workflow

- Branch from `main` for features: `feature/description`
- Branch from `main` for fixes: `fix/description`
- Keep PRs focused and small where possible
- Write descriptive commit messages

## Common Development Tasks

```bash
# Start all services locally
docker-compose up

# Start web app only
cd web && npm run dev

# Start API server only
cd api && npm run dev

# Run web scraper (SpareRoom, London, max £1200/mo)
cd scraper && source .venv/bin/activate && python -m scraper.main scrape

# Scraper with custom options
python -m scraper.main scrape --where London --max-rent 1000 --max-pages 5

# Preview scraped JSONL data
python -m scraper.main preview data/raw/listings_*.jsonl

# Run all tests
npm test                    # JS/TS tests
cd scraper && pytest        # Python tests

# Database operations
npm run db:migrate          # Run pending migrations
npm run db:seed             # Seed sample data
npm run db:reset            # Drop and recreate (dev only)

# Linting
npm run lint                # ESLint + Prettier check
npm run lint:fix            # Auto-fix lint issues
```

## Environment Setup

1. Install Node.js >= 18, Python >= 3.10, PostgreSQL >= 14
2. Copy `.env.example` to `.env` and fill in values
3. Run `docker-compose up` for the full stack, or start services individually
4. Run `npm run db:migrate` to set up the database schema

### Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Token signing secret |
| `S3_BUCKET` | Property image storage bucket |
| `SCRAPER_INTERVAL` | Cron expression for scraper schedule |

## Important Context for AI Assistants

- **This is a student-focused product.** UX decisions should prioritise simplicity and speed. Students are often browsing on mobile with limited time.
- **The swipe mechanic is central.** Do not replace it with a traditional list/grid view. The card-based swipe is the core interaction pattern.
- **Web scraping is legally sensitive.** Scrapers must respect robots.txt, rate-limit requests, and avoid storing copyrighted content (e.g., listing descriptions should be summarised, not copied verbatim). Always check terms of service.
- **Contact details are revealed only on match (swipe right).** This is a deliberate design choice to create a sense of commitment and reduce spam to landlords.
- **Data freshness matters.** Stale listings (already let, incorrect pricing) erode trust quickly. The scraper pipeline should flag or remove listings that are no longer available.
- **Privacy and GDPR compliance.** User data and landlord contact details must be handled in compliance with UK GDPR. Minimise data collection and provide clear consent flows.

## Current Status / Roadmap

### Phase 1 -- Foundation (Current)
- [x] Project scaffolding and repo structure
- [x] Web scraper MVP -- SpareRoom spider (Playwright + BS4, JSONL export, PostgreSQL ingestion)
- [ ] Database schema design (users, listings, swipes, contacts)
- [ ] Basic API endpoints (auth, listings CRUD, swipe actions)
- [x] Basic web UI with swipe cards

### Phase 2 -- Core Experience
- [x] Full swipe interface with animations (framer-motion drag gestures, LIKE/NOPE stamps)
- [x] Contact reveal flow (modal on swipe right with landlord details)
- [x] Notes on liked listings (optional note input on like)
- [x] Liked listings page with expandable cards, editable notes, contact details
- [x] Progress tracking page with application pipeline (saved → contacted → viewing → applied → accepted/rejected)
- [x] Pricing toggle (pcm / pw / pppm / pppw) — persisted, shown across all pages
- [x] Bottom navigation bar (Swipe / Liked / Progress) with badge count
- [x] Shared state via React context + localStorage persistence
- [ ] Filter system (budget, location, type, university)
- [ ] Multiple scraper sources

### Phase 3 -- Mobile and Polish
- [ ] Mobile app (React Native or Flutter)
- [ ] Push notifications for new matches
- [ ] University SSO integration
- [ ] Map-based browsing view
- [ ] Saved searches and alerts

### Phase 4 -- Scale
- [ ] Landlord self-service portal
- [ ] Review and rating system
- [ ] Roommate matching feature
- [ ] Expand beyond London to other UK university cities
