"use client";

import { useEffect, useRef } from 'react';
import { ReactNode } from 'react';
import { formatPrice } from '@/shared/lib/format';

interface Item {
  id?: string | number;
  name?: string;
  price?: number;
  craftable?: boolean;
  sheen?: string;
  assetId?: string;
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
  item_url?: string;
  item_id?: number;
}

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

function getImageUrl(imageItem?: string) {
  if (!imageItem) return null;
  if (imageItem.startsWith('http')) return imageItem;
  return `https://community.cloudflare.steamstatic.com/economy/image/${imageItem}`;
}

function getAttributes(item: Item) {
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
}

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl transform transition-all duration-300"
      >
        <div className="p-6 md:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Image column */}
            <div className="flex-shrink-0 w-full md:w-64">
              <div className="aspect-square rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
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
                <svg className="w-16 h-16 text-gray-300 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Details column */}
            <div className="flex-1 min-w-0">
              <h2 id="modal-title" className="text-2xl font-bold text-[#1A2A3A] mb-2">{item.name || 'Unknown Item'}</h2>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${item.craftable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.craftable ? 'Craftable' : 'Non-Craftable'}
                </span>
                {item.paint && <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">Painted</span>}
                {item.festivized && <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">Festivized</span>}
                {item.killstreaker && <span className="px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700">Killstreak</span>}
                {item.sheen && <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">Sheen</span>}
              </div>

              <div className="text-2xl font-bold text-[#1A2A3A] mb-6">
                {formatPrice(item.price || 0)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-6">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">Listing ID</p>
                  <p className="font-mono font-medium text-[#1A2A3A]">{item.id || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">Item ID</p>
                  <p className="font-mono font-medium text-[#1A2A3A]">{item.item_id || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">Asset ID</p>
                  <p className="font-mono font-medium text-[#1A2A3A]">{item.assetId || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">Instance ID</p>
                  <p className="font-mono font-medium text-[#1A2A3A]">{item.instanceId || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500">Class ID</p>
                  <p className="font-mono font-medium text-[#1A2A3A]">{item.classId || '-'}</p>
                </div>
              </div>

              {getAttributes(item).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#1A2A3A] mb-3">Attributes</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAttributes(item).map((attr, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-700 border border-gray-100">
                        {attr.label}: {attr.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                {item.bot && item.assetId && (
                  <a
                    href={`https://steamcommunity.com/profiles/${item.bot}/inventory/#440_2_${item.assetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#292e37] text-white hover:bg-[#1a1e22] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View in Bot Inventory
                  </a>
                )}
                {item.item_url && (
                  <a
                    href={item.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on MannCo.Store
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}