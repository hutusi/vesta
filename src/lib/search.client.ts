/**
 * Catalog search matching. Pure functions so they can be unit-tested and reused
 * by the browser-side filter in catalog.astro.
 *
 * All matchable strings (haystack + pinyin) are precomputed at build time, so
 * the browser only does plain substring checks — no pinyin library shipped, no
 * fuzzy ranking. This is precise, fast, and predictable for a Chinese catalog:
 *   三国   → haystack substring
 *   sanguo → full-pinyin substring (py)
 *   sgyy   → pinyin-initials substring (pyi)
 */

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

export interface Searchable {
  /** Combined title/author/publisher/… haystack, already lowercased. */
  search: string;
  /** Full pinyin, tone-stripped, lowercased, no separators. */
  py: string;
  /** Pinyin initials, lowercased. */
  pyi: string;
}

export function matchesQuery(item: Searchable, query: string): boolean {
  if (!query) return true;
  return (
    item.search.includes(query) ||
    item.py.includes(query) ||
    item.pyi.includes(query)
  );
}

export function matchesFilters(
  item: { category: string; language: string },
  filters: { category: string; language: string },
): boolean {
  if (filters.category && item.category !== filters.category) return false;
  if (filters.language && item.language !== filters.language) return false;
  return true;
}
