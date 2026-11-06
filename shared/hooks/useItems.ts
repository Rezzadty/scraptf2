"use client";

import useSWR from 'swr';
import { Item, Meta } from '@/shared/types/item';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useItems() {
  const { data: items, error, isLoading, mutate } = useSWR<Item[]>('/api/items', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  const { data: meta } = useSWR<Meta>('/api/meta', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  return { items: items ?? [], meta, isLoading, error, refresh: mutate };
}