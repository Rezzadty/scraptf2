# TF2 Market Tracker

Modern web dashboard for tracking real-time TF2 item prices from Mannco.store API with on-demand scraping, visual analytics, and **live WebSocket feed** for newly listed items.

## Purpose

A bento-style dashboard for TF2 market data. Users trigger scrapes with custom filters (game, item, quality, wear, class, spell) and view live pricing, highest prices, and latest drops. Features transparent background theming and dock-based navigation.

### Primary Focus

- **Team Fortress 2 (App ID 440)**: Hats, weapons, unusuals, killstreaks, spells
- Extensible to other Steam games via API configuration

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ /ui (Dashboard)│  │ /ui/items    │  │ /ui/live (WebSocket Feed)      │  │
│  │ - Stats cards │  │ - Paginated  │  │ - Real-time listing_added      │  │
│  │ - FilterBar   │  │   table      │  │ - listing_removed/price_changed│  │
│  │ - Trigger     │  │ - Filters    │  │ - Pause/Resume/Clear           │  │
│  │   scrape      │  │ - Export     │  │ - Connection status            │  │
│  └──────┬────────┘  └──────┬───────┘  └──────────────┬─────────────────┘  │
│         │                  │                         │                     │
│         ▼                  ▼                         ▼                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    API Routes (/app/api)                              │  │
│  │  POST /api/scrape ──▶ spawns scripts/scrape.py                       │  │
│  │  GET  /api/items  ──▶ reads data/items.json                          │  │
│  │  GET  /api/meta   ──▶ reads data/meta.json                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              WEBSOCKET PROXY (proxy/index.js)                        │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │  │
│  │  │ Frontend WS │◀──▶│ Proxy WS    │◀──▶│ Mannco WS               │  │  │
│  │  │ (clients)   │    │ (Node/WS)   │    │ (wss://api.mannco.store)│  │  │
│  │  └─────────────┘    └──────┬──────┘    └─────────────────────────┘  │  │
│  │                             │                                        │  │
│  │                    ┌────────┴────────┐                              │  │
│  │                    │ JWT Auth + Cache│                              │  │
│  │                    │ /user/login     │                              │  │
│  │                    │ /item/{id}      │                              │  │
│  │                    └─────────────────┘                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Python Scraper    │
                    │ (scripts/scrape.py)│
                    └───────────────────┘
```

### Components

1. **Scraper Script (`scripts/scrape.py`)**
   - Connects to Mannco.store API with token auth and retry logic
   - Paginates listings (page/offset/cursor styles)
   - CLI args for game, item slug, quality, wear, class, spell
   - Writes to `data/items.json` and `data/meta.json`

2. **API Routes (`app/api/`)**
   - `POST /api/scrape`: Accepts filters, runs scraper, returns items + metadata
   - `GET /api/items`: Returns stored listings
   - `GET /api/meta`: Returns fetch metadata and active filters

3. **Dashboard UI (`app/ui/`)**
   - `page.tsx`: Bento grid dashboard with transparent SumiSumi.jpg background, stat cards, metadata display
   - `items/page.tsx`: Paginated searchable item table with filters, sorting, export
   - `live/page.tsx`: **Real-time WebSocket feed** — new listings appear instantly via `listing_added`, with `listing_removed`/`price_changed` handling, pause/resume, connection status
   - `shared/ui/FilterBar.tsx`: Filter controls for game, item, quality, wear, class, spell

4. **WebSocket Proxy (`proxy/`)**
   - `index.js`: Node.js/Express + `ws` server
   - Connects to `wss://api.mannco.store/ws` (receive-only)
   - Handles JWT auth via `/user/login` with API key (never exposed to frontend)
   - Caches item details from `GET /item/{id}` (in-memory, by itemId)
   - Broadcasts clean events: `listing_added`, `listing_removed`, `price_changed`, `status`
   - Auto-reconnects with exponential backoff (1s → 30s max)
   - Runs on `ws://localhost:3001`

## Setup

### Requirements
- Node.js 18+
- Python 3.10+
- `pip install requests python-dotenv`

### Environment Configuration

**Frontend (`.env.local` in project root):**
```env
NEXT_PUBLIC_PROXY_WS_URL=ws://localhost:3001
```

**Proxy (`proxy/.env`):**
```env
MANNCO_API_KEY=your_mannco_api_key
PROXY_PORT=3001
```

**Scraper (`.env` in project root):**
```env
BASE_URL=https://api.mannco.store
API_TOKEN=your_mannco_api_token
TARGET_ITEM=440
PAGE_SIZE=100
MAX_PAGES=1000
REQUEST_TIMEOUT=15
PAGE_DELAY=0.5
PAGINATION_STYLE=page
```

### Run

```bash
# Terminal 1: Start WebSocket proxy
cd proxy
npm install
npm run dev

# Terminal 2: Start Next.js frontend
npm install
npm run dev
```

Open `http://localhost:3000/ui`.

### CLI Scraper
```bash
# TF2 listings
python scripts/scrape.py --game 440

# Specific item with filters
python scripts/scrape.py --game 440 --item 440-mann-co-supply-crate-key --quality Unique
```

## Data Output

- `data/items.json`: Array of listings with `id`, `price`, `assetId`, `sheen`, `spell`, `wear`
- `data/meta.json`:
  ```json
  {
    "fetched_at": "ISO-8601 UTC",
    "record_count": 0,
    "source_url": "https://api.mannco.store/item/listing/440",
    "api_version": "v1",
    "pagination_style": "page",
    "script_version": "1.0.2",
    "target_item": "440",
    "filters_applied": { "game": "440", "quality": "Unique" }
  }
  ```

## Features

- **Bento Grid Dashboard**: Modern card-based layout for stats and metadata
- **Transparent Background**: SumiSumi.jpg as subtle page backdrop
- **On-Demand Scraping**: Trigger data fetches with custom filters from UI
- **Real-Time Stats**: Highest price, latest drops, last updated timestamps
- **Paginated Item Table**: Search, filter (price, craftable, paint, killstreak, bot), sort, export CSV/JSON
- **Live WebSocket Feed** (`/ui/live`):
  - Instant `listing_added` push (newest on top)
  - Auto-remove sold items via `listing_removed`
  - Auto-update prices via `price_changed`
  - Connection status: Connected / Reconnecting / Disconnected
  - Pause/Resume/Clear controls
  - Filters: search, min/max price
  - Max 100 rows (auto-prune oldest)
  - Item details resolved via proxy (cached)
- **Shared Types**: `shared/types/item.ts` for `Item` and `Meta` interfaces
- **SWR Caching**: `shared/hooks/useItems.ts` for dashboard/items pages
- **Error Boundaries**: Graceful error UI on all pages

## Architecture Notes

### Why a Proxy?
- **Security**: API key/JWT never touches frontend
- **CORS**: Browser cannot connect directly to `wss://api.mannco.store/ws`
- **Caching**: Item details (`/item/{id}`) cached in-memory to avoid rate limits
- **Normalization**: Proxy emits clean, typed events to frontend

### Assumptions (from spec)
| Unknown | Assumption |
|---------|------------|
| WS auth | No auth message needed (receive-only per docs) |
| Heartbeats | Not implemented; WS close triggers reconnect |
| Rate limits | Proxy caches item details; lookups throttled by event rate |
| Game filter | Not in WS event; available in item details if needed |

## Project Structure

```
scraptf/
├── app/
│   ├── api/scrape/route.ts   # Trigger scraper
│   ├── api/items/route.ts    # GET items.json
│   ├── api/meta/route.ts     # GET meta.json
│   ├── ui/
│   │   ├── page.tsx          # Dashboard
│   │   ├── items/page.tsx    # All Items table
│   │   ├── live/page.tsx     # Live WebSocket feed
│   │   └── items/[id]/page.tsx # Item detail
├── proxy/
│   ├── index.js              # WebSocket proxy server
│   └── package.json
├── scripts/
│   └── scrape.py             # Python scraper
├── shared/
│   ├── hooks/
│   │   ├── useItems.ts       # SWR hook for REST data
│   │   └── useLiveListings.ts # WebSocket hook
│   ├── types/item.ts         # Shared Item/Meta types
│   ├── ui/                   # Reusable components
│   └── lib/                  # Utilities (format, darkMode, api)
├── data/                     # Output JSON (gitignored)
└── .env.local                # Frontend env (NEXT_PUBLIC_PROXY_WS_URL)
```