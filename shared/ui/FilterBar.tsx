"use client";

import { useState } from 'react';
import { ScrapeFilters } from '@/shared/lib/api';

interface FilterBarProps {
  onApply: (filters: ScrapeFilters) => Promise<void> | void;
  loading?: boolean;
  currentGame?: string;
  currentFilters?: Record<string, string>;
}

export const SUPPORTED_GAMES = [
  { id: '440', name: 'Team Fortress 2', desc: 'Hats, weapons, unusuals, spells' },
];

export const ITEM_MODELS: Record<string, Array<{ label: string; value: string }>> = {
  '440': [
    { label: 'All TF2 Listings (App ID: 440)', value: '' },
    { label: 'Mann Co. Supply Crate Key', value: '440-mann-co-supply-crate-key' },
    { label: 'Tour of Duty Ticket', value: '440-tour-of-duty-ticket' },
    { label: 'Earbuds', value: '440-earbuds' },
    { label: "Bill's Hat", value: '440-bills-hat' },
    { label: 'Australium Medi Gun', value: '440-australium-medi-gun' },
    { label: 'Australium Rocket Launcher', value: '440-australium-rocket-launcher' },
    { label: 'Refined Metal', value: '440-refined-metal' },
  ],
  '730': [
    { label: 'All CS2 Listings (App ID: 730)', value: '' },
    { label: 'AK-47 | Redline', value: '730-ak-47-redline' },
    { label: 'AWP | Asiimov', value: '730-awp-asiimov' },
    { label: 'Desert Eagle | Printstream', value: '730-desert-eagle-printstream' },
    { label: 'Dreams & Nightmares Case', value: '730-dreams-nightmares-case' },
    { label: 'Fracture Case', value: '730-fracture-case' },
  ],
  '570': [
    { label: 'All Dota 2 Listings (App ID: 570)', value: '' },
    { label: 'Dragonclaw Hook', value: '570-dragonclaw-hook' },
    { label: 'Manifold Paradox', value: '570-manifold-paradox' },
  ],
  '252490': [
    { label: 'All Rust Listings (App ID: 252490)', value: '' },
    { label: 'Glowing Skull', value: '252490-glowing-skull' },
  ],
  '753': [
    { label: 'All Steam Items (App ID: 753)', value: '' },
  ],
};

export const TF2_CLASSES = [
  'All Classes',
  'Scout',
  'Soldier',
  'Pyro',
  'Demoman',
  'Heavy',
  'Engineer',
  'Medic',
  'Sniper',
  'Spy',
];

export const WEAR_VALUES = [
  'Factory New',
  'Minimal Wear',
  'Field-Tested',
  'Well-Worn',
  'Battle-Scarred',
];

export const QUALITIES = [
  'Unique',
  'Strange',
  'Unusual',
  'Genuine',
  'Vintage',
  'Haunted',
  "Collector's",
  'Decorated Weapon',
];

export const SPELLS = [
  'Spectral Spectrum',
  'Die Job',
  'Chromatic Corruption',
  'Putrescent Pigmentation',
  'Sinister Staining',
  'Voices From Below',
];

export function FilterBar({
  onApply,
  loading = false,
  currentGame = '440',
  currentFilters,
}: FilterBarProps) {
  const game = '440';
  const [selectedModel, setSelectedModel] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [quality, setQuality] = useState(currentFilters?.quality || '');
  const [wear, setWear] = useState(currentFilters?.wear || '');
  const [itemClass, setItemClass] = useState(currentFilters?.class || '');
  const [spell, setSpell] = useState(currentFilters?.spell || '');

  const availableModels = ITEM_MODELS[game] || [{ label: `All Listings (${game})`, value: '' }];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItem = customItem.trim() || selectedModel || undefined;
    onApply({
      game,
      item: finalItem,
      quality: quality || undefined,
      wear: wear || undefined,
      itemClass: itemClass && itemClass !== 'All Classes' ? itemClass : undefined,
      spell: spell || undefined,
    });
  };

  const inputClass = "w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7BA4D3] transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filter & Scrape</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Filter by Item, Class, Wear & Quality</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#7BA4D3]/15 text-[#5A85B3] dark:text-[#A2C4E8]">
          App ID: {game}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Item Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Item Model Preset
          </label>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              if (e.target.value) setCustomItem('');
            }}
            className={inputClass}
          >
            {availableModels.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
            <option value="CUSTOM">Custom Item Name/Slug...</option>
          </select>
        </div>

        {/* Custom Item input if selected */}
        {selectedModel === 'CUSTOM' && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Custom Item Identifier / Slug
            </label>
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="e.g. 440-australium-rocket-launcher or item ID"
              className={inputClass}
            />
          </div>
        )}

        {/* Class Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Class
          </label>
          <select
            value={itemClass}
            onChange={(e) => setItemClass(e.target.value)}
            className={inputClass}
          >
            {TF2_CLASSES.map((c) => (
              <option key={c} value={c === 'All Classes' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Wear Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Wear (Exterior)
          </label>
          <select
            value={wear}
            onChange={(e) => setWear(e.target.value)}
            className={inputClass}
          >
            <option value="">All Wears</option>
            {WEAR_VALUES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Quality Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Quality
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className={inputClass}
          >
            <option value="">All Qualities</option>
            {QUALITIES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Spell Filter (primarily TF2) */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Spell
          </label>
          <select
            value={spell}
            onChange={(e) => setSpell(e.target.value)}
            className={inputClass}
          >
            <option value="">All Spells</option>
            {SPELLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all mt-2 ${
          loading
            ? 'bg-[#5A85B3] cursor-not-allowed opacity-75'
            : 'bg-[#7BA4D3] hover:bg-[#5A85B3] active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Scraping Market Data...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Apply Filters & Scrape</span>
          </>
        )}
      </button>
    </form>
  );
}