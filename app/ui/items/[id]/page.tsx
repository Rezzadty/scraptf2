"use client";

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/shared/lib/format';
import { Item } from '@/shared/types/item';

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      const resolvedParams = await params;
      const itemId = resolvedParams.id;
      try {
        const res = await fetch('/api/items');
        if (res.ok) {
          const data = await res.json();
          const found = data.find((i: Item) => String(i.id) === itemId || String(i.item_id) === itemId);
          if (found) {
            setItem(found);
          } else {
            notFound();
          }
        } else {
          notFound();
        }
      } catch {
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const getImageUrl = (imageItem?: string) => {
    if (!imageItem) return undefined;
    if (imageItem.startsWith('http')) return imageItem;
    return `https://community.cloudflare.steamstatic.com/economy/image/${imageItem}`;
  };

  const getAttributes = () => {
    const attrs: { label: string; value: string }[] = [];
    if (item.paint) attrs.push({ label: 'Paint', value: item.paint });
    if (item.sheen) attrs.push({ label: 'Sheen', value: item.sheen });
    if (item.killstreaker) attrs.push({ label: 'Killstreaker', value: item.killstreaker });
    if (item.level) attrs.push({ label: 'Level', value: String(item.level) });
    if (item.festivized) attrs.push({ label: 'Festivized', value: 'Yes' });
    if (item.wear) attrs.push({ label: 'Wear', value: item.wear });
    if (item.paintseed) attrs.push({ label: 'Paint Seed', value: item.paintseed });
    if (item.spell) attrs.push({ label: 'Spell', value: item.spell });
    return attrs;
  };

  return (
    <div className="min-h-screen py-8 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" style={{ backgroundImage: 'url(/assets/SumiSumi.jpg)' }} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#7BA4D3]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 left-40 w-72 h-72 bg-[#A2C4E8]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        <Link
          href="/ui/items"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Items
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="shrink-0 w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {getImageUrl(item.imageItem) ? (
                  <img
                    src={getImageUrl(item.imageItem)}
                    alt={item.name || 'Item'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{item.name || 'Unknown Item'}</h1>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${item.craftable
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {item.craftable ? 'Craftable' : 'Non-Craftable'}
                  </span>
                  {item.paint && <span className="px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400">Painted</span>}
                  {item.festivized && <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400">Festivized</span>}
                  {item.killstreaker && <span className="px-3 py-1 rounded-full text-sm bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-400">Killstreak</span>}
                  {item.sheen && <span className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400">Sheen</span>}
                </div>

                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {formatPrice(item.price || 0)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400">Listing ID</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">{item.id || '-'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400">Item ID</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">{item.item_id || '-'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400">Asset ID</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">{item.assetId || '-'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400">Instance ID</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">{item.instanceId || '-'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400">Class ID</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">{item.classId || '-'}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 dark:text-gray-400">Bot SteamID</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white truncate max-w-150px">{item.assetId ? item.assetId.slice(0, 12) + '...' : '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {getAttributes().length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attributes</h2>
                <div className="flex flex-wrap gap-2">
                  {getAttributes().map((attr, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {attr.label}: {attr.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(item.inspect || item.item_url) && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inspect in Game</h2>
                <div className="flex flex-wrap gap-3">
                  {item.inspect && (
                    <a
                      href={item.inspect}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7BA4D3] text-white hover:bg-[#5A85B3] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Open in Steam
                    </a>
                  )}
                  {item.item_url && (
                    <a
                      href={item.item_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on MannCo.Store
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}