# SwipeStay

**Find your next London student accommodation — one swipe at a time.**

<!-- Badges -->
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-lightgrey)

---

## About

SwipeStay is a mobile-first platform (with full web app support) that brings the familiar swipe interface to the world of student accommodation in London. Instead of scrolling through endless listings on multiple websites, students can browse available flats, shared houses, and student halls with a simple swipe — right to like, left to pass.

When a student likes a property, SwipeStay instantly reveals landlord or letting agent contact details, making it faster than ever to get in touch and secure a place to live. A built-in tracking dashboard keeps every liked and contacted property organised in one place, so students never lose track of where they are in the process.

Behind the scenes, an automated web scraping pipeline continuously pulls fresh accommodation listings from various sources and pushes them directly into users' feeds — no manual searching required.

### Who is SwipeStay for?

- **London university students** — both undergraduate and postgraduate — searching for their next home.
- **International students** arriving in London who need a fast, intuitive way to find accommodation from abroad.
- **Students seeking flexibility** — whether looking for term-time lets or year-round tenancies.

---

## Features

| Feature | Description |
|---|---|
| **Swipe Interface** | Drag-to-swipe cards with smooth animations, LIKE/NOPE stamps, and a progress indicator. Built with framer-motion. |
| **Accommodation Details** | Rich listing cards with photos, pricing, location, room info, transport times (tube, bus, bike, walk), amenities, and university proximity. |
| **Contact Reveal** | Swiping right reveals landlord/agent contact details in a polished modal. |
| **Notes on Likes** | Add personal notes when liking a listing (e.g. "ask about move-in date"). Notes are shown in the end-of-deck summary. |
| **Tracking Dashboard** | A personal dashboard to view all liked and contacted accommodations, and track application status in one place. *(planned)* |
| **Web Scraper** | An automated scraping pipeline that collects accommodation listings from various sources and feeds them into the platform. *(planned)* |
| **Smart Filters** | Filter by budget, location, property type, distance to a specific university, and move-in date. *(planned)* |

---

## Tech Stack

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Mobile App | React Native *or* Flutter | Cross-platform mobile experience (iOS and Android) *(planned)* |
| Web App | Next.js 16 (App Router) + React 19 | Server-rendered web interface with responsive design |
| Styling | Tailwind CSS v4 | Utility-first styling for rapid UI development |
| Animations | framer-motion | Swipe gestures, card transitions, and modal animations |

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| API Server | Node.js (Express / Fastify) *or* Python (FastAPI) | RESTful API to serve listings, manage users, and handle swipe actions |
| Database | PostgreSQL | Relational storage for users, listings, swipe history, and application tracking |
| Cache | Redis | Session management and caching of frequently accessed listings |
| Authentication | JWT / OAuth 2.0 | Secure user authentication, with support for university SSO |

### Data Pipeline

| Layer | Technology | Purpose |
|---|---|---|
| Web Scraper | Python (Playwright + BeautifulSoup + Pydantic) | Automated collection of accommodation listings from external sources |
| Data Export | JSONL + PostgreSQL ingestion | Decoupled pipeline: scrape to JSONL, then upsert into database |
| Storage | AWS S3 / Cloudinary | Image storage for listing photos |

### Infrastructure

| Layer | Technology | Purpose |
|---|---|---|
| Containerisation | Docker | Consistent development and deployment environments |
| CI/CD | GitHub Actions | Automated testing, linting, and deployment |
| Hosting | Vercel (web) / AWS (API) | Production hosting |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10 (for the scraping pipeline)
- **PostgreSQL** >= 14
- **Docker** (optional, for containerised development)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/swipestay.git
   cd swipestay
   ```

2. **Install dependencies**

   ```bash
   # Frontend (web)
   cd web
   npm install

   # Backend API
   cd ../api
   npm install

   # Scraper
   cd ../scraper
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e ".[dev]"
   playwright install chromium
   ```

3. **Set up environment variables**

   Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Required variables include:

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `REDIS_URL` | Redis connection string |
   | `JWT_SECRET` | Secret key for signing tokens |
   | `S3_BUCKET` | Image storage bucket name |

4. **Initialise the database**

   ```bash
   npm run db:migrate
   npm run db:seed    # optional: load sample listings
   ```

5. **Start the development servers**

   ```bash
   # Start all services (if using Docker)
   docker-compose up

   # Or start individually
   npm run dev        # web app
   npm run api:dev    # backend API
   cd scraper && source .venv/bin/activate && python -m scraper.main scrape   # scraper
   ```

6. **Open the app**

   Navigate to `http://localhost:3000` in your browser.

---

## Project Structure

```
swipestay/
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/            # App router (layout, page, globals.css)
│   │   ├── components/     # UI components (SwipeCard, SwipeDeck, NoteModal)
│   │   ├── data/           # Mock data (listings.ts)
│   │   └── types/          # TypeScript type definitions (listing.ts)
│   └── public/             # Static assets
│
├── mobile/                 # React Native / Flutter mobile app
│   └── src/
│
├── api/                    # Backend API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Database models and schemas
│   │   ├── services/       # Business logic layer
│   │   ├── middleware/     # Auth, validation, error handling
│   │   └── utils/          # Helper functions
│   └── migrations/         # Database migration files
│
├── scraper/                # Web scraping pipeline (Python, Playwright)
│   ├── src/scraper/
│   │   ├── spiders/        # Spider classes (base + per-source)
│   │   ├── parsers/        # HTML parsing logic (separated for testability)
│   │   ├── exporters/      # JSONL file export + PostgreSQL ingestion
│   │   ├── utils/          # Rate limiting, helpers
│   │   ├── models.py       # Pydantic listing schema
│   │   ├── config.py       # Scraper settings
│   │   └── main.py         # CLI entrypoint (click)
│   ├── data/raw/           # JSONL output (gitignored)
│   └── tests/fixtures/     # Saved HTML for parser tests
│
├── shared/                 # Shared types, constants, and validation schemas
├── docker-compose.yml      # Multi-service Docker configuration
├── .env.example            # Environment variable template
└── README.md
```

---

## Contributing

Contributions are welcome. To get involved:

1. **Fork** the repository.
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and ensure all tests pass:
   ```bash
   npm test
   ```
4. **Commit** with a clear, descriptive message.
5. **Push** your branch and open a **Pull Request** against `main`.

### Guidelines

- Follow the existing code style and linting configuration.
- Write tests for new features and bug fixes.
- Keep pull requests focused — one feature or fix per PR.
- Update documentation if your changes affect the public API or user-facing behaviour.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>SwipeStay</strong> — Making student accommodation search simple, fast, and intuitive.
</p>
