export interface ScrapeFilters {
  game?: string;
  item?: string;
  quality?: string;
  spell?: string;
  wear?: string;
  itemClass?: string;
}

export async function fetchItems() {
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function fetchMeta() {
  const res = await fetch('/api/meta');
  if (!res.ok) throw new Error('Failed to fetch meta');
  return res.json();
}

export async function triggerScrape(filters: ScrapeFilters) {
  const res = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  if (!res.ok) throw new Error('Scrape failed');
  return res.json();
}
