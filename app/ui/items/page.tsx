"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/shared/lib/format';
import { PageLoader } from '@/shared/ui/PageLoader';
import { ItemDetailModal } from '@/shared/ui/ItemDetailModal';

interface Item {
  id?: string | number;
  name?: string;
  price?: number;
  craftable?: boolean;
  sheen?: string;
  assetId?: string;
  item_url?: string;
  url?: string;
  instanceId?: string;
  classId?: string;
  paint?: string;
  spell?: string;
  killstreaker?: string;
  level?: number;
  festivized?: number;
  inspect?: string;
  imageItem?: string;
  wear?: string | null;
  paintseed?: string | null;
  item_id?: number;
}

export function AllItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'price' | 'name'>('price');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const itemsPerPage = 50;

  async function fetchItems() {
    setLoading(true);
    const startTime = Date.now();
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 600 - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items
    .filter(
      (item) =>
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(item.id || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'price') return (b.price || 0) - (a.price || 0);
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      {loading && <PageLoader text="Loading items..." />}
      <div className="min-h-screen py-8 px-6 relative">
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
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/ui"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-[#1A2A3A] hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-3xl font-bold text-[#1A2A3A]">All Items</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7BA4D3]"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'price' | 'name')}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7BA4D3]"
            >
              <option value="price">Sort by Price</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F0F4F8]">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-[#1A2A3A]">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1A2A3A]">ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1A2A3A]">Price</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1A2A3A]">Craftable</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1A2A3A]">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item, idx) => (
                  <tr key={item.id || `${item.name}-${idx}`}>
                    <td className="px-6 py-4 text-[#1A2A3A] font-medium">
                      {item.name ||
                        (item.sheen
                          ? `${item.sheen} Item`
                          : item.assetId
                            ? `Listing #${item.assetId}`
                            : 'Unknown Item')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                      {item.id || '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1A2A3A]">
                      {formatPrice(item.price || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          item.craftable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.craftable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.id ? (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7BA4D3]/15 text-[#5A85B3] hover:bg-[#7BA4D3] hover:text-white transition-all"
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
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-[#F0F4F8]">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg bg-[#7BA4D3] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg bg-[#7BA4D3] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}

export default AllItems;