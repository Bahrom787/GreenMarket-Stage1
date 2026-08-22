import type { SellerMapRecord } from "@/platform-core/map/viewmodels/MapViewModel";

export const PRODUCT_SIMILARITY_THRESHOLD_PERCENT = 85;

export interface ProductSearchListing {
  productName: string;
  seller: SellerMapRecord;
  price: number;
  unit: string;
  tags?: string[];
}

export interface ProductSearchCandidate {
  name: string;
  normalizedName: string;
  tags: string[];
}

export interface ProductSellerMatch {
  seller: SellerMapRecord;
  productName: string;
  price: number;
  unit: string;
}

export interface ProductSearchResult {
  matchedProduct: string | null;
  suggestedProduct: string | null;
  sellers: ProductSellerMatch[];
}

export function normalizeProductSearch(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    [previous, current] = [current, previous];
  }

  return previous[b.length];
}

export function stringSimilarityPercent(a: string, b: string): number {
  const left = normalizeProductSearch(a);
  const right = normalizeProductSearch(b);
  if (left === right) return 100;
  if (!left || !right) return 0;
  const maxLength = Math.max(left.length, right.length);
  return Math.round(((maxLength - levenshteinDistance(left, right)) / maxLength) * 100);
}

export function productCandidateSimilarity(query: string, candidate: ProductSearchCandidate): number {
  const q = normalizeProductSearch(query);
  return candidate.tags.reduce(
    (best, tag) => Math.max(best, stringSimilarityPercent(q, tag)),
    stringSimilarityPercent(q, candidate.normalizedName),
  );
}

function directMatchRank(candidate: ProductSearchCandidate, q: string): number {
  if (candidate.normalizedName === q) return 0;
  if (candidate.normalizedName.startsWith(q)) return 1;
  if (candidate.tags.some((tag) => tag === q)) return 2;
  if (candidate.normalizedName.includes(q)) return 3;
  if (candidate.tags.some((tag) => tag.includes(q) || q.includes(tag))) return 4;
  return 5;
}

export function findDirectProductMatches(
  query: string,
  candidates: ProductSearchCandidate[],
): ProductSearchCandidate[] {
  const q = normalizeProductSearch(query);
  if (!q) return [];

  return candidates
    .filter(
      (candidate) =>
        candidate.normalizedName.includes(q) || candidate.tags.some((tag) => tag.includes(q) || q.includes(tag)),
    )
    .sort((a, b) => {
      const rankDiff = directMatchRank(a, q) - directMatchRank(b, q);
      return rankDiff || a.normalizedName.localeCompare(b.normalizedName);
    });
}

export function findMostSimilarProduct(
  query: string,
  candidates: ProductSearchCandidate[],
  thresholdPercent = PRODUCT_SIMILARITY_THRESHOLD_PERCENT,
): ProductSearchCandidate | null {
  const q = normalizeProductSearch(query);
  if (!q) return null;

  let best: ProductSearchCandidate | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = productCandidateSimilarity(q, candidate);
    if (score >= thresholdPercent && score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

export function searchProducts(query: string, listings: ProductSearchListing[]): ProductSearchResult {
  const candidates = productCandidates(listings);
  const direct = findDirectProductMatches(query, candidates);
  const selected = direct[0] ?? findMostSimilarProduct(query, candidates);

  if (!selected) {
    return { matchedProduct: null, suggestedProduct: null, sellers: [] };
  }

  const matchedDirectly = direct.length > 0;
  return {
    matchedProduct: matchedDirectly ? selected.name : null,
    suggestedProduct: matchedDirectly ? null : selected.name,
    sellers: listings
      .filter((listing) => normalizeProductSearch(listing.productName) === selected.normalizedName)
      .map(({ seller, productName, price, unit }) => ({ seller, productName, price, unit }))
      .sort((a, b) => a.price - b.price || a.seller.name.localeCompare(b.seller.name)),
  };
}

function productCandidates(listings: ProductSearchListing[]): ProductSearchCandidate[] {
  const byName = new Map<string, ProductSearchCandidate>();

  for (const listing of listings) {
    const normalizedName = normalizeProductSearch(listing.productName);
    if (!normalizedName) continue;
    const current = byName.get(normalizedName) ?? { name: listing.productName, normalizedName, tags: [] };
    current.tags = Array.from(
      new Set([...current.tags, ...(listing.tags ?? []).map(normalizeProductSearch).filter(Boolean)]),
    );
    byName.set(normalizedName, current);
  }

  return Array.from(byName.values());
}
