export interface Item {
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
  item_id?: number;
  bot?: string;
  item_url?: string;
  url?: string;
  quality?: string;
  type?: string;
}

export interface Meta {
  fetched_at: string;
  record_count: number;
  source_url: string;
  api_version: string;
  pagination_style: string;
  script_version?: string;
  target_item?: string;
  filters_applied?: Record<string, string>;
}