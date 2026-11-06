import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fetch from 'node-fetch';
import { WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PROXY_PORT || 3001;
const MANNCO_WS_URL = 'wss://api.mannco.store/ws';
const MANNCO_API_BASE = 'https://api.mannco.store';
const API_KEY = process.env.MANNCO_API_KEY;

if (!API_KEY) {
  console.error('MANNCO_API_KEY not set in .env');
  process.exit(1);
}

// In-memory cache for item details: itemId -> { name, slug, image, ... }
const itemCache = new Map();

// JWT token management
let jwtToken = null;
let jwtExpiry = 0;

async function getJwtToken() {
  const now = Date.now();
  if (jwtToken && jwtExpiry > now + 60000) {
    return jwtToken;
  }

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
      console.log('[proxy] JWT obtained');
      return jwtToken;
    }
    throw new Error(data.message || 'Login failed');
  } catch (e) {
    console.error('[proxy] JWT fetch failed:', e.message);
    throw e;
  }
}

async function fetchItemDetails(itemId) {
  if (itemCache.has(itemId)) {
    return itemCache.get(itemId);
  }

  const token = await getJwtToken();
  try {
    const res = await fetch(`${MANNCO_API_BASE}/item/${itemId}`, {
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

    const item = {
      id: info.id,
      name: info.name,
      slug: info.url || `${info.game_id}-${info.id}`,
      image: info.image,
      game_id: info.game_id,
      quality: info.quality,
      craftable: info.craftable === 1,
      price: info.price,
    };

    itemCache.set(itemId, item);
    console.log(`[proxy] Cached item ${itemId}: ${item.name}`);
    return item;
  } catch (e) {
    console.error(`[proxy] Failed to fetch item ${itemId}:`, e.message);
    // Return placeholder
    const placeholder = { id: itemId, name: `Item #${itemId}`, slug: null, image: null };
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

    if (event === 'listing_added') {
      const { id, assetId, itemId, price } = data;
      const itemDetails = await fetchItemDetails(itemId);

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