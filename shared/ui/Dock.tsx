"use client";

import Link from 'next/link';

interface DockProps {
  onRefresh?: () => void;
  onFilter?: () => void;
}

export function Dock({ onRefresh, onFilter }: DockProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-gray-200/50 flex items-center gap-4">
        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="p-2 rounded-full hover:bg-gray-100 text-[#1A2A3A] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <Link href="/ui/items" title="View All Items" className="p-2 rounded-full hover:bg-gray-100 text-[#1A2A3A] transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
        <button
          onClick={onFilter}
          title="Filter & Scrape"
          className="p-2 rounded-full hover:bg-gray-100 text-[#1A2A3A] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
