"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/shared/lib/format';
import { PageLoader } from '@/shared/ui/PageLoader';
import { ItemDetailModal } from '@/shared/ui/ItemDetailModal';
import { useDarkMode } from '@/shared/lib/darkMode';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { Item } from '@/shared/types/item';
import { useItems } from '@/shared/hooks/useItems';

type SortField = 'price' | 'name';
type SortDirection = 'asc' | 'desc';

interface Filters {
  search: string;
  craftable: 'all' | 'true' | 'false';
  priceMin: number | '';
  priceMax: number | '';
  hasPaint: boolean;
  hasKillstreak: boolean;
  isFestivized: boolean;
  bots: string[];
}

export function AllItems() {
  const { theme, toggleTheme } = useDarkMode();
  const { items, isLoading, error, refresh } = useItems();
  const [sort, setSort] = useState<SortField>('price');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    craftable: 'all',
    priceMin: '',
    priceMax: '',
    hasPaint: false,
    hasKillstreak: false,
    isFestivized: false,
    bots: [],
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);


  // Show loader when filters change
  useEffect(() => {
    setFilterLoading(true);
    const timer = setTimeout(() => setFilterLoading(false), 200);
    return () => clearTimeout(timer);
  }, [filters, showAdvancedFilters]);

  const allBots = [...new Set(items.map(i => i.bot).filter(Boolean))] as string[];

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => refresh(), refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, refresh]);

  useEffect(() => {
    if (!isLoading && !error) {
      setLastFetched(new Date());
    }
  }, [isLoading, error]);

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = (item.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        String(item.id || '').toLowerCase().includes(filters.search.toLowerCase());
      if (!matchesSearch) return false;

      if (filters.craftable !== 'all') {
        if (filters.craftable === 'true' && !item.craftable) return false;
        if (filters.craftable === 'false' && item.craftable) return false;
      }

      const price = item.price || 0;
      if (filters.priceMin !== '' && price < filters.priceMin) return false;
      if (filters.priceMax !== '' && price > filters.priceMax) return false;

      if (filters.hasPaint && !item.paint) return false;
      if (filters.hasKillstreak && !item.killstreaker) return false;
      if (filters.isFestivized && !item.festivized) return false;

      if (filters.bots.length > 0 && item.bot && !filters.bots.includes(item.bot)) return false;

      return true;
    })
    .sort((a, b) => {
      let aVal: number | string = a[sort] ?? 0;
      let bVal: number | string = b[sort] ?? 0;
      if (sort === 'name') {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      const dir = sortDir === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const SortAsc = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );

  const SortDesc = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const exportData = (format: 'csv' | 'json') => {
    const data = filteredItems.map(item => ({
      'Listing ID': item.id,
      'Item ID': item.item_id,
      Name: item.name,
      Price: item.price ? formatPrice(item.price) : '-',
      Craftable: item.craftable ? 'Yes' : 'No',
      Paint: item.paint || '-',
      Sheen: item.sheen || '-',
      Killstreak: item.killstreaker || '-',
      Festivized: item.festivized ? 'Yes' : 'No',
      Level: item.level || '-',
      'Asset ID': item.assetId,
      'Instance ID': item.instanceId,
      'Class ID': item.classId,
      Bot: item.bot || '-',
      Inspect: item.inspect || '-',
      URL: item.item_url || '-',
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tf2-items-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${String(v).split('"').join('""')}"`).join(',')).join('\n');
      const csv = headers + '\n' + rows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tf2-items-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const copyToClipboard = () => {
    const headers = ['Listing ID', 'Name', 'Price', 'Craftable', 'Paint', 'Killstreak', 'Festivized', 'Bot', 'Asset ID'];
    const rows = paginatedItems.map(item => [
      item.id,
      item.name,
      formatPrice(item.price || 0),
      item.craftable ? 'Yes' : 'No',
      item.paint || '-',
      item.killstreaker || '-',
      item.festivized ? 'Yes' : 'No',
      item.bot || '-',
      item.assetId || '-',
    ].join('\t'));
    const text = headers.join('\t') + '\n' + rows.join('\n');
    navigator.clipboard.writeText(text);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      craftable: 'all',
      priceMin: '',
      priceMax: '',
      hasPaint: false,
      hasKillstreak: false,
      isFestivized: false,
      bots: [],
    });
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.craftable !== 'all' || filters.priceMin !== '' || filters.priceMax !== '' ||
    filters.hasPaint || filters.hasKillstreak || filters.isFestivized || filters.bots.length > 0;

  const tableStyle = { borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' };

  return (
    <ErrorBoundary>
      <>
        {filterLoading && <PageLoader text="Applying filters..." />}
        <div className="min-h-screen py-8 px-6 relative bg-gray-50 dark:bg-gray-900">
        {/* Background image */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
          style={{ backgroundImage: 'url(/assets/SumiSumi.jpg)' }}
        />
        {/* Background ambient blur */}
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Items</h1>
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
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                className="px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={200}>200 per page</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#7BA4D3] focus:ring-[#7BA4D3]"
                />
                Auto-refresh
              </label>

              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={120}>2m</option>
                  <option value={300}>5m</option>
                </select>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => exportData('csv')}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900"
                >
                  Export JSON
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Copy Page
                </button>
              </div>
            </div>
          </div>

          {/* Search & Basic Filters */}
          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={filters.search}
                  onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                  className="w-full pl-12 pr-4 py-2 rounded-xl border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <select
                value={filters.craftable}
                onChange={(e) => { setFilters(f => ({ ...f, craftable: e.target.value as Filters['craftable'] })); setPage(1); }}
                className="px-4 py-2 rounded-xl border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Items</option>
                <option value="true">Craftable Only</option>
                <option value="false">Non-Craftable Only</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.priceMin}
                  onChange={(e) => { setFilters(f => ({ ...f, priceMin: e.target.value === '' ? '' : Number(e.target.value) })); setPage(1); }}
                  className="px-4 py-2 rounded-xl border text-sm w-32 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.priceMax}
                  onChange={(e) => { setFilters(f => ({ ...f, priceMax: e.target.value === '' ? '' : Number(e.target.value) })); setPage(1); }}
                  className="px-4 py-2 rounded-xl border text-sm w-32 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm font-medium transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.hasPaint}
                    onChange={(e) => { setFilters(f => ({ ...f, hasPaint: e.target.checked })); setPage(1); }}
                    className="w-4 h-4 rounded border-gray-300 text-[#7BA4D3] focus:ring-[#7BA4D3]"
                  />
                  Painted
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.hasKillstreak}
                    onChange={(e) => { setFilters(f => ({ ...f, hasKillstreak: e.target.checked })); setPage(1); }}
                    className="w-4 h-4 rounded border-gray-300 text-[#7BA4D3] focus:ring-[#7BA4D3]"
                  />
                  Killstreak
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.isFestivized}
                    onChange={(e) => { setFilters(f => ({ ...f, isFestivized: e.target.checked })); setPage(1); }}
                    className="w-4 h-4 rounded border-gray-300 text-[#7BA4D3] focus:ring-[#7BA4D3]"
                  />
                  Festivized
                </label>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Filter by Bot</label>
                  <select
                    multiple
                    value={filters.bots}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                      setFilters(f => ({ ...f, bots: selected }));
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    size={4}
                  >
                    {allBots.map(bot => (
                      <option key={bot} value={bot}>{bot.slice(-8)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 text-sm text-[#7BA4D3] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="rounded-3xl shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white">Name</span>
                      {sort === 'name' && (sortDir === 'asc' ? <SortAsc /> : <SortDesc />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-500">ID</th>
                  <th className="px-6 py-4 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white">Price</span>
                      {sort === 'price' && (sortDir === 'asc' ? <SortAsc /> : <SortDesc />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Craftable</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Bot</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedItems.map((item, idx) => (
                  <tr key={item.id || `${item.name}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.name ||
                        (item.sheen
                          ? `${item.sheen} Item`
                          : item.assetId
                            ? `Listing #${item.assetId}`
                            : 'Unknown Item')}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">
                      {item.id || '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(item.price || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${item.craftable
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        {item.craftable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm max-w-150px truncate">
                      {item.bot ? item.bot.slice(-8) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {item.id ? (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-[#7BA4D3]/15 text-[#5A85B3] hover:bg-[#7BA4D3] hover:text-white"
                        >
                          <span>Details</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages} • {filteredItems.length} items
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed bg-[#7BA4D3] disabled:bg-gray-400"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed bg-[#7BA4D3] disabled:bg-gray-400"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <ItemDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      </div>
      <footer className="py-8 text-center border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Created by <a href="https://github.com/Rezzadty" className="text-[#7BA4D3] font-bold" target="_blank" rel="noopener noreferrer">Rezzadty</a>
          </p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} TF2 Market Tracker. All rights reserved.
          </p>
          {lastFetched && (
            <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
              Last updated: {lastFetched.toLocaleTimeString()}
            </p>
          )}
        </footer>
      </>
    </ErrorBoundary>
  );
}

export default AllItems;