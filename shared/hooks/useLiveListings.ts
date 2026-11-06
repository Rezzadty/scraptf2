"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LiveListing {
  id: number;
  assetId: string;
  itemId: number;
  price: number;
  ts: number;
  name: string;
  slug: string | undefined;
  image: string | null;
  game_id: number;
}

export interface UseLiveListingsOptions {
  proxyUrl?: string;
  maxRows?: number;
}

export interface UseLiveListingsReturn {
  listings: LiveListing[];
  status: 'connected' | 'reconnecting' | 'disconnected';
  paused: boolean;
  setPaused: (paused: boolean) => void;
  clearListings: () => void;
  error: string | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function relativeTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function useLiveListings(options: UseLiveListingsOptions = {}): UseLiveListingsReturn {
  const { proxyUrl = 'ws://localhost:3001', maxRows = 100 } = options;

  const [listings, setListings] = useState<LiveListing[]>([]);
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(proxyUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setError(null);
        reconnectDelayRef.current = 1000;
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === 'status') {
          setStatus(msg.status);
          return;
        }

        if (msg.type === 'listing_added' && msg.listing) {
          const listing = msg.listing;
          setListings((prev) => {
            // Deduplicate by id
            if (prev.some((l) => l.id === listing.id)) return prev;
            const next = [listing, ...prev].slice(0, maxRows);
            return next;
          });
        } else if (msg.type === 'listing_removed' && msg.id) {
          setListings((prev) => prev.filter((l) => l.id !== msg.id));
        } else if (msg.type === 'price_changed' && msg.id && msg.newPrice !== undefined) {
          setListings((prev) =>
            prev.map((l) => (l.id === msg.id ? { ...l, price: msg.newPrice } : l))
          );
        }
      };

      ws.onclose = () => {
        setStatus('reconnecting');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
        }, reconnectDelayRef.current);
      };

      ws.onerror = (err) => {
        setError('WebSocket error');
        console.error('[live] WS error:', err);
      };
    } catch (e) {
      setError('Failed to connect');
      setStatus('disconnected');
    }
  }, [proxyUrl, maxRows]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const clearListings = useCallback(() => {
    setListings([]);
  }, []);

  return {
    listings,
    status,
    paused,
    setPaused,
    clearListings,
    error,
  };
}