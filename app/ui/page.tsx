"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BentoCard } from '@/shared/ui/BentoCard';
import { FilterBar } from '@/shared/ui/FilterBar';
import { PageLoader } from '@/shared/ui/PageLoader';
import { ToastContainer } from '@/shared/ui/Toast';
import { formatPrice, formatDate, formatTime } from '@/shared/lib/format';
import { ScrapeFilters, triggerScrape } from '@/shared/lib/api';

interface Item {
  id?: string;
  name?: string;
  price?: number;
  craftable?: boolean;
}

interface Meta {
  fetched_at: string;
  record_count: number;
  source_url: string;
  api_version: string;
  pagination_style: string;
  script_version?: string;
  target_item?: string;
  filters_applied?: Record<string, string>;
}

export default function DashboardPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const filterSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setInitialLoading(true);
    const startTime = Date.now();
    try {
      const [itemsRes, metaRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/meta'),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        if (Array.isArray(itemsData)) setItems(itemsData);
      }

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        if (metaData && metaData.fetched_at) setMeta(metaData);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 600 - elapsed);
      setTimeout(() => {
        setInitialLoading(false);
      }, remaining);
    }
  }

  async function handleApplyFilter(filters: ScrapeFilters) {
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await triggerScrape(filters);
      if (result.items) setItems(result.items);
      if (result.meta) setMeta(result.meta);
      setStatusMessage(`Scrape successful: ${result.meta?.record_count ?? result.items?.length ?? 0} items fetched.`);
    } catch (err) {
      console.error('Scrape failed:', err);
      setStatusMessage('Scrape failed. Check API credentials or parameters.');
    } finally {
      setLoading(false);
    }
  }

  const highestPrice = items.length
    ? Math.max(...items.map((i) => i.price || 0))
    : 0;

  const latestDrop = items.length
    ? (items[0]?.price || 0)
    : 0;

  const visualCards = [
    { title: 'Highest Price', price: formatPrice(highestPrice), gradient: 'linear-gradient(135deg, #7BA4D3, #A2C4E8)' },
    { title: 'Latest Drop', price: formatPrice(latestDrop), gradient: 'linear-gradient(135deg, #8EC5FC, #E0C3FC)' },
  ];

  return (
    <>
      {initialLoading && <PageLoader text="Loading dashboard..." />}
      <div className="min-h-screen relative pb-24">
        {/* Background image */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
          style={{ backgroundImage: 'url(/assets/SumiSumi.jpg)' }}
        />
        {/* Background ambient blur */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#7BA4D3]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 left-40 w-72 h-72 bg-[#A2C4E8]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Top Hero Banner - Split Layout */}
          <BentoCard className="mb-6 col-span-full overflow-hidden">
            <div className="flex flex-col lg:flex-row h-full items-center gap-8">
              {/* Left: Data Column */}
              <div className="flex-1 text-left">
                <h1 className="text-4xl font-bold text-[#1A2A3A] mb-2">TF2 Market Tracker</h1>
                <p className="text-[#1A2A3A]/70 mb-6">Welcome back! Here is the latest data from Mannco.store.</p>

                {meta ? (
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="bg-white/50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Items</p>
                      <p className="text-2xl font-bold text-[#1A2A3A]">{meta.record_count}</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Last Updated</p>
                      <p className="text-xl font-semibold text-[#1A2A3A]">{formatDate(meta.fetched_at)}</p>
                    </div>
                    {meta.filters_applied && Object.keys(meta.filters_applied).length > 0 && (
                      <div className="bg-white/50 p-3 rounded-2xl border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Filter</p>
                        <p className="text-sm font-semibold text-[#7BA4D3]">
                          {Object.entries(meta.filters_applied).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-4">No scrape data yet. Click filter button to begin.</p>
                )}
              </div>

              {/* Right: Art Column */}
              <div className="relative w-full lg:w-1/3 h-64 lg:h-auto flex justify-center items-center">
                <div className="relative group">
                  {/* Art Frame */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#7BA4D3] to-[#A2C4E8] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <img
                    src="/assets/Sumi.jpg"
                    alt="Market Mascot"
                    className="relative w-48 h-48 lg:w-64 lg:h-64 object-cover rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Second image as a subtle floating accent or toggle could go here, but for now, we use the primary for clean look */}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Middle Row: Filter (Primary) + About Scrape (Sidebar) */}
          <div ref={filterSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Filter & Scrape - Primary Action (2/3 width) */}
            <div className="lg:col-span-2">
              <BentoCard className="min-h-[280px]">
                <FilterBar
                  onApply={handleApplyFilter}
                  loading={loading}
                  currentFilters={meta?.filters_applied}
                />
              </BentoCard>
            </div>

            {/* About Scrape - Info Sidebar (1/3 width) */}
            <BentoCard className="min-h-[280px]">
              <h2 className="text-lg font-bold text-[#1A2A3A] mb-3">About the Scrape</h2>
              {meta ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Target Item</p>
                    <p className="text-[#1A2A3A] font-medium">{meta.target_item || meta.source_url?.split('/').pop() || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">API Version</p>
                    <p className="text-[#1A2A3A] font-medium">{meta.api_version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pagination Style</p>
                    <p className="text-[#1A2A3A] font-medium">{meta.pagination_style}</p>
                  </div>
                  {meta.filters_applied && Object.keys(meta.filters_applied).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Filters</p>
                      <p className="text-[#7BA4D3] font-medium text-sm">
                        {Object.entries(meta.filters_applied).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    Data scraped from Mannco.store API.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-gray-500 text-sm">
                  <p>Loading scrape metadata...</p>
                  <p className="text-xs text-gray-400">Apply filters to fetch real-time TF2 market data.</p>
                </div>
              )}
            </BentoCard>
          </div>

          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {visualCards.map((card, idx) => (
              <BentoCard key={idx} className="relative overflow-hidden min-h-[140px]">
                <div className="absolute inset-0 opacity-10" style={{ background: card.gradient }}></div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg font-bold text-[#1A2A3A] mb-2">{card.title}</h3>
                  <div className="text-3xl font-bold text-[#1A2A3A]">{card.price}</div>
                </div>
              </BentoCard>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <BentoCard className="flex flex-col items-center justify-center min-h-[140px]">
              {meta ? (
                <>
                  <p className="text-3xl font-bold text-[#1A2A3A]">{formatDate(meta.fetched_at)}</p>
                  <p className="text-sm text-gray-500 mt-1">Last Updated</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-400">Not Scraped</p>
                  <p className="text-sm text-gray-400 mt-1">Last Updated</p>
                </>
              )}
            </BentoCard>

            <BentoCard className="flex flex-col items-center justify-center min-h-[140px]">
              {meta ? (
                <>
                  <p className="text-3xl font-bold text-[#1A2A3A]">{formatTime(meta.fetched_at)}</p>
                  <p className="text-sm text-gray-500 mt-1">UTC Time</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-400">--:--</p>
                  <p className="text-sm text-gray-400 mt-1">UTC Time</p>
                </>
              )}
            </BentoCard>

            <Link href="/ui/items" className="group">
              <BentoCard className="flex flex-col items-center justify-center hover:shadow-lg transition-shadow min-h-[140px]">
                <div className="text-xl font-semibold text-[#7BA4D3] group-hover:text-[#5A85B3]">
                  View More
                </div>
                <p className="text-sm text-gray-500 mt-1">View All Items ({items.length})</p>
              </BentoCard>
            </Link>

            <BentoCard className="flex flex-col items-center justify-center bg-gradient-to-br from-[#7BA4D3] to-[#8EC5FC] text-white min-h-[140px]">
              <div className="text-2xl font-bold">TF2 Market</div>
              <p className="text-sm mt-2 opacity-90">Real-time pricing</p>
            </BentoCard>
          </div>
        </div>
      </div>

      <footer className="py-8 text-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-500 font-medium">
          Created by <span className="text-[#7BA4D3] font-bold">Rezzadty</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} TF2 Market Tracker. All rights reserved.</p>
      </footer>

      <ToastContainer
        message={statusMessage}
        type={statusMessage?.startsWith('Scrape failed') ? 'error' : 'success'}
        onClose={() => setStatusMessage(null)}
      />
    </>
  );
}