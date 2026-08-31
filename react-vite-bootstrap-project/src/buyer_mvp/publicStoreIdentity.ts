import type { SellerCardResponse } from './types';

export interface StorePublicIdentity {
  sellerId: number;
  publicSlug: string;
  publicUrl: string;
}

interface ConfigIdentity {
  public_slug?: string;
  public_url?: string;
}

type ConfigMap = Record<string, ConfigIdentity | string>;

const TECHNICAL_HOSTS = ['vercel.app', 'localhost', '127.0.0.1'];

function envValue(key: string) {
  const value = import.meta.env[key] as string | undefined;
  return value?.trim() || undefined;
}

function normalizeSlug(value?: string | null) {
  const slug = value?.trim().toLowerCase();
  if (!slug || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) return undefined;
  return slug;
}

function normalizePublicUrl(value?: string | null) {
  if (!value?.trim()) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:') return undefined;
  if (TECHNICAL_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return undefined;
  }
  if (/\/(store|seller)\/\d+(\/|$)/.test(url.pathname)) return undefined;
  if (url.searchParams.has('seller_id') || url.searchParams.has('storeId')) return undefined;

  url.hash = '';
  url.search = '';
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (url.pathname !== '/') url.pathname += '/';
  return url.href;
}

function configuredIdentities(): ConfigMap {
  const raw = envValue('VITE_PUBLIC_STORE_IDENTITIES');
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ConfigMap) : {};
  } catch {
    return {};
  }
}

function identityFromConfig(sellerId: number): ConfigIdentity | undefined {
  const config = configuredIdentities()[String(sellerId)];
  if (!config) return undefined;
  if (typeof config === 'string') return { public_url: config };
  return config;
}

function publicUrlFromSlug(slug?: string) {
  if (!slug) return undefined;

  const pattern = envValue('VITE_PUBLIC_STORE_URL_PATTERN');
  if (pattern?.includes('{slug}')) return normalizePublicUrl(pattern.replace('{slug}', slug));

  const domain = envValue('VITE_PUBLIC_STORE_DOMAIN')?.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return domain ? normalizePublicUrl(`https://${slug}.${domain}/`) : undefined;
}

function slugFromPublicUrl(publicUrl?: string) {
  if (!publicUrl) return undefined;
  const host = new URL(publicUrl).hostname.split('.')[0];
  return normalizeSlug(host);
}

function slugContainsSellerId(slug: string, sellerId: number) {
  return new RegExp(`(^|-)${sellerId}($|-)`).test(slug);
}

export function getStorePublicIdentity(seller: SellerCardResponse): StorePublicIdentity | undefined {
  const config = identityFromConfig(seller.seller_id);
  const publicSlug = normalizeSlug(seller.public_slug ?? config?.public_slug);
  const publicUrl = normalizePublicUrl(seller.public_url) ?? normalizePublicUrl(config?.public_url) ?? publicUrlFromSlug(publicSlug);
  const slug = publicSlug ?? slugFromPublicUrl(publicUrl);

  if (!slug || !publicUrl) return undefined;
  if (slugContainsSellerId(slug, seller.seller_id)) return undefined;
  return {
    sellerId: seller.seller_id,
    publicSlug: slug,
    publicUrl,
  };
}

export function getPublicStoreUrl(seller: SellerCardResponse) {
  return getStorePublicIdentity(seller)?.publicUrl;
}

export function resolvePublicStoreIdentity(publicUrl: string): StorePublicIdentity | undefined {
  const normalizedUrl = normalizePublicUrl(publicUrl);
  if (!normalizedUrl) return undefined;

  for (const [sellerId, config] of Object.entries(configuredIdentities())) {
    const item = typeof config === 'string' ? { public_url: config } : config;
    const itemUrl = normalizePublicUrl(item.public_url) ?? publicUrlFromSlug(normalizeSlug(item.public_slug));
    const itemSlug = normalizeSlug(item.public_slug) ?? slugFromPublicUrl(itemUrl);
    if (itemUrl === normalizedUrl && itemSlug) {
      return { sellerId: Number(sellerId), publicSlug: itemSlug, publicUrl: itemUrl };
    }
  }

  return undefined;
}
