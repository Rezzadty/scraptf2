"use client";

import { useState, useEffect } from 'react';
import { formatPrice } from '@/shared/lib/format';

interface Item {
  id?: string | number;
  name?: string;
  price?: number;
  craftable?: boolean;
  sheen?: string;
  assetId?: string;
  item_url?: string;
  url?: string;
}

export function AllItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'price' | 'name'>('price');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  async function fetchItems() {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchItems();
    };
    init();
  }, []);

  const filteredItems = items
    .filter((item) => (item.name || '').toLowerCase().includes(search.toLowerCase()) || String(item.id || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price') return (b.price || 0) - (a.price || 0);
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1A2A3A] mb-6">All Items</h1>

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
              {paginatedItems.map((item, idx) => {
                const storeUrl = item.item_url || (item.url ? (item.url.startsWith('http') ? item.url : `https://mannco.store/item/${item.url}`) : null);
                return (
                  <tr key={item.id || `${item.name}-${idx}`}>
                    <td className="px-6 py-4 text-[#1A2A3A] font-medium">
                      {item.name || (item.sheen ? `${item.sheen} Item` : item.assetId ? `Listing #${item.assetId}` : 'Unknown Item')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{item.id || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-[#1A2A3A]">{formatPrice(item.price || 0)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${item.craftable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {item.craftable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {storeUrl ? (
                        <a
                          href={storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7BA4D3]/15 text-[#5A85B3] hover:bg-[#7BA4D3] hover:text-white transition-all"
                        >
                          <span>Store</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
  );
}

export default AllItems;
