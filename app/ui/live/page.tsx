"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDarkMode } from '@/shared/lib/darkMode';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { useLiveListings, LiveListing } from '@/shared/hooks/useLiveListings';

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

function getImageUrl(image?: string | null) {
  if (!image) return undefined;
  if (image.startsWith('http')) return image;
  return `https://community.cloudflare.steamstatic.com/economy/image/${image}`;
}

function getManncoUrl(slug?: string, itemId?: number): string | undefined {
  if (slug) return `https://mannco.store/item/${slug}`;
  if (itemId) return `https://mannco.store/item/${itemId}`;
  return undefined;
}

export function LiveListingsPage() {
  const { theme, toggleTheme } = useDarkMode();
  const [filters, setFilters] = useState({
    search: '',
    priceMin: '',
    priceMax: '',
  });

  const {
    listings,
    status,
    paused,
    setPaused,
    clearListings,
    error,
  } = useLiveListings({ proxyUrl: process.env.NEXT_PUBLIC_PROXY_WS_URL || 'ws://localhost:3001' });

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(filters.search.toLowerCase());
      if (!matchesSearch) return false;

      const price = l.price;
      if (filters.priceMin !== '' && price < Number(filters.priceMin) * 100) return false;
      if (filters.priceMax !== '' && price > Number(filters.priceMax) * 100) return false;

      return true;
    });
  }, [listings, filters]);

  const statusColors = {
    connected: 'bg-green-500',
    reconnecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  };

  const statusLabels = {
    connected: 'Live',
    reconnecting: 'Reconnecting...',
    disconnected: 'Disconnected',
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-8 px-6 relative bg-gray-50 dark:bg-gray-900">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
          style={{ backgroundImage: 'url(/assets/SumiSumi.jpg)' }}
        />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#7BA4D3]/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-40 w-72 h-72 bg-[#A2C4E8]/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/ui"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Listings</h1>

              <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]} text-white`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {statusLabels[status]}
                {paused && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">Paused</span>}
              </span>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPaused(!paused)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${paused
                  ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                  : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'}`}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={clearListings}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search item name..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-full pl-12 pr-4 py-2 rounded-xl border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Min $"
                  value={filters.priceMin}
                  onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                  className="px-4 py-2 rounded-xl border text-sm w-32 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Max $"
                  value={filters.priceMax}
                  onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                  className="px-4 py-2 rounded-xl border text-sm w-32 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Item</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Price</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Time</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredListings.map((listing, idx) => (
                  <tr
                    key={listing.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 ${idx === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {listing.image && (
                          <img
                            src={getImageUrl(listing.image)}
                            alt={listing.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{listing.name}</p>
                          <p className="text-xs text-gray-500 font-mono">ID: {listing.id} • Item: {listing.itemId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(listing.price)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-sm">
                      {relativeTime(listing.ts)}
                    </td>
                    <td className="px-6 py-4">
                      {getManncoUrl(listing.slug ?? undefined, listing.itemId) && (
                        <a
                          href={getManncoUrl(listing.slug ?? undefined, listing.itemId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-[#7BA4D3]/15 text-[#5A85B3] hover:bg-[#7BA4D3] hover:text-white"
                        >
                          <span>View</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredListings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      {listings.length === 0
                        ? 'Waiting for new listings...'
                        : 'No listings match your filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredListings.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-500">
                Showing {filteredListings.length} of {listings.length} listings
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default LiveListingsPage;