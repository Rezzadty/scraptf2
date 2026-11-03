# TF2 Market Tracker

Modern web dashboard for tracking real-time TF2 item prices from Mannco.store API with on-demand scraping and visual analytics.

## Purpose

A bento-style dashboard for TF2 market data. Users trigger scrapes with custom filters (game, item, quality, wear, class, spell) and view live pricing, highest prices, and latest drops. Features transparent background theming and dock-based navigation.

### Primary Focus

- **Team Fortress 2 (App ID 440)**: Hats, weapons, unusuals, killstreaks, spells
- Extensible to other Steam games via API configuration

## System Architecture

```text
Dashboard UI (Next.js /app/ui)
       │
       ▼
Next.js Route Handlers (/app/api)
  ├── POST /api/scrape ──> spawns scripts/scrape.py
  ├── GET  /api/items  ──> reads data/items.json
  └── GET  /api/meta   ──> reads data/meta.json
       │
       ▼
Python Scraper (scripts/scrape.py)
       │
       ▼
Mannco.store API (https://api.mannco.store/item/listing/{item})
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
   - `items/page.tsx`: Paginated searchable item table
   - `shared/ui/FilterBar.tsx`: Filter controls for game, item, quality, wear, class, spell
   - `shared/ui/Dock.tsx`: Floating navigation dock for refresh and filter actions

## Setup

### Requirements
- Node.js 18+
- Python 3.10+
- `pip install requests python-dotenv`

### Environment Configuration
Create `.env` in project root:

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
- **Dock Navigation**: Floating action bar for quick refresh/filter access
- **On-Demand Scraping**: Trigger data fetches with custom filters from UI
- **Real-Time Stats**: Highest price, latest drops, last updated timestamps
