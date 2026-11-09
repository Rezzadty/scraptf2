import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PROXY_PORT || 3001;
const MANNCO_WS_URL = 'wss://api.mannco.store/ws';
const MANNCO_API_BASE = 'https://api.mannco.store';
const API_KEY = process.env.MANNCO_API_KEY || process.env.API_TOKEN;

if (!API_KEY) {
  console.error('MANNCO_API_KEY not set in .env');
  process.exit(1);
}

// In-memory cache for item details: itemId -> { name, slug, image, ... }
const itemCache = new Map();

// JWT token management
const JWT_CACHE_FILE = join(__dirname, '..', 'data', '.jwt_cache.json');
let jwtToken = null;
let jwtExpiry = 0;

async function getJwtToken() {
  const now = Date.now();
  if (jwtToken && jwtExpiry > now + 60000) {
    return jwtToken;
  }

  try {
    if (existsSync(JWT_CACHE_FILE)) {
      const cached = JSON.parse(readFileSync(JWT_CACHE_FILE, 'utf-8'));
      if (cached.jwt && cached.exp * 1000 > now + 60000) {
        jwtToken = cached.jwt;
        jwtExpiry = cached.exp * 1000;
        return jwtToken;
      }
    }
  } catch {}

  try {
    const res = await fetch(`${MANNCO_API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: API_KEY }),
    });

    const data = await res.json();
    if (data.success && data.content?.jwt) {
      jwtToken = data.content.jwt;
      // JWT typically expires in 24h, refresh 5min early
      jwtExpiry = now + 23 * 60 * 60 * 1000;
      try {
        mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
        writeFileSync(JWT_CACHE_FILE, JSON.stringify({ jwt: jwtToken, exp: Math.floor(jwtExpiry / 1000) }));
      } catch {}
      console.log('[proxy] JWT obtained');
      return jwtToken;
    }
    const errMessage = data.message || (typeof data.content === 'string' ? data.content : 'Login failed');
    throw new Error(errMessage);
  } catch (e) {
    console.error('[proxy] JWT fetch failed:', e.message);
    throw e;
  }
}

async function fetchItemDetails(itemId) {
  if (itemCache.has(itemId)) {
    return itemCache.get(itemId);
  }

  try {
    const token = await getJwtToken();
    const res = await fetch(`${MANNCO_API_BASE}/item/details/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        jwtToken = null; // Force re-login next time
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    // Expected shape from openapi.json: data.content.informations
    const info = data?.content?.informations;
    if (!info) throw new Error('No item info in response');

    const gameId = Number(info.game ?? info.game_id ?? 440);
    const item = {
      id: info.id,
      name: info.name,
      slug: info.url || `${gameId}-${info.id}`,
      image: info.image,
      game_id: gameId,
      quality: info.quality,
      type: info.type,
      craftable: info.craftable === 1,
      price: info.price,
    };

    itemCache.set(itemId, item);
    console.log(`[proxy] Cached item ${itemId}: ${item.name} (game ${gameId})`);
    return item;
  } catch (e) {
    console.error(`[proxy] Failed to fetch item ${itemId}:`, e.message);
    // Return placeholder
    const placeholder = { id: itemId, name: `Item #${itemId}`, slug: null, image: null, game_id: 440 };
    itemCache.set(itemId, placeholder);
    return placeholder;
  }
}

// Connected frontend clients
const clients = new Set();

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Mannco WebSocket connection with reconnection
let manncoWs = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30000;

function connectToMannco() {
  console.log('[proxy] Connecting to Mannco WebSocket...');
  broadcast({ type: 'status', status: 'connecting' });

  manncoWs = new WebSocket(MANNCO_WS_URL);

  manncoWs.on('open', () => {
    console.log('[proxy] Connected to Mannco WebSocket');
    reconnectDelay = 1000;
    broadcast({ type: 'status', status: 'connected' });
  });

  manncoWs.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return; // Ignore invalid JSON
    }

    const { event, ts, data } = msg;
    if (!event || !data) return;

    try {
      if (event === 'listing_added') {
        const { id, assetId, itemId, price } = data;
        const itemDetails = await fetchItemDetails(itemId);

        // Filter: only Team Fortress 2 items (game_id 440)
        if (itemDetails.game_id && itemDetails.game_id !== 440) {
          return;
        }

        broadcast({
          type: 'listing_added',
          listing: {
            id,
            assetId,
            itemId,
            price,
            ts,
            name: itemDetails.name,
            slug: itemDetails.slug,
            image: itemDetails.image,
            game_id: itemDetails.game_id,
            quality: itemDetails.quality,
            type: itemDetails.type,
            craftable: itemDetails.craftable,
          },
        });
      } else if (event === 'listing_removed') {
        broadcast({ type: 'listing_removed', id: data.id });
      } else if (event === 'price_changed') {
        broadcast({
          type: 'price_changed',
          id: data.id,
          assetId: data.assetId,
          itemId: data.itemId,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
        });
      }
    } catch (err) {
      console.error('[proxy] Message handling error:', err.message);
    }
    // Ignore other events
  });

  manncoWs.on('close', () => {
    console.log('[proxy] Mannco WebSocket closed, reconnecting in', reconnectDelay, 'ms');
    broadcast({ type: 'status', status: 'reconnecting' });
    setTimeout(connectToMannco, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
  });

  manncoWs.on('error', (err) => {
    console.error('[proxy] Mannco WebSocket error:', err.message);
    // Close will trigger reconnect
  });
}

// Frontend WebSocket endpoint
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[proxy] Frontend client connected');
  clients.add(ws);

  // Send current status immediately
  ws.send(JSON.stringify({
    type: 'status',
    status: manncoWs?.readyState === WebSocket.OPEN ? 'connected' : 'reconnecting',
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[proxy] Frontend client disconnected');
  });

  ws.on('error', (err) => {
    console.error('[proxy] Frontend client error:', err.message);
    clients.delete(ws);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    manncoConnected: manncoWs?.readyState === WebSocket.OPEN,
    cacheSize: itemCache.size,
  });
});

// Start
connectToMannco();
server.listen(PORT, () => {
  console.log(`[proxy] Running on http://localhost:${PORT}`);
});