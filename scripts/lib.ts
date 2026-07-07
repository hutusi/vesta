/**
 * Pure helpers for the ingestion pipeline. Kept side-effect-free so they can be
 * unit-tested independently of file/network I/O.
 */
import { pinyin } from "pinyin-pro";

/** Minimal RFC-4180 CSV parser: handles quotes, embedded commas/newlines, BOM. */
export function parseCsv(input: string): Record<string, string>[] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

/** First non-empty value among the given header aliases (case-insensitive). */
export function pick(row: Record<string, string>, aliases: string[]): string {
  const lower = new Map<string, string>();
  for (const key of Object.keys(row)) lower.set(key.toLowerCase().trim(), row[key]);
  for (const alias of aliases) {
    const v = lower.get(alias.toLowerCase());
    if (v && v.trim()) return v.trim();
  }
  return "";
}

/** Split a delimited list on common CJK/Latin separators. */
export function splitList(raw: string): string[] {
  return (raw ?? "")
    .split(/[、,，/;；|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Extract a plausible 4-digit publication year. */
export function extractYear(raw: string): number | undefined {
  const m = /(\d{4})/.exec(raw ?? "");
  if (!m) return undefined;
  const y = Number(m[1]);
  return y >= 1000 && y <= 2100 ? y : undefined;
}

export function stripIsbn(raw: string): string {
  return (raw ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isbn10To13(isbn10: string): string | null {
  const s = stripIsbn(isbn10);
  if (s.length !== 10) return null;
  const core = "978" + s.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return core + check;
}

export function isValidIsbn13(isbn13: string): boolean {
  const s = stripIsbn(isbn13);
  if (s.length !== 13 || /[^0-9]/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(s[12]);
}

/** Normalize any ISBN-10/13 to a valid canonical ISBN-13, or null if invalid. */
export function normalizeIsbn(raw: string): string | null {
  const s = stripIsbn(raw);
  if (s.length === 13) return isValidIsbn13(s) ? s : null;
  if (s.length === 10) {
    const c = isbn10To13(s);
    return c && isValidIsbn13(c) ? c : null;
  }
  return null;
}

function shortHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).padStart(6, "0").slice(0, 6);
}

/** Romanize CJK text into an ascii slug fragment (Latin words kept intact). */
export function pinyinSlug(text: string): string {
  // Only romanize CJK runs; pinyin-pro would otherwise space out Latin letters
  // ("The" → "T h e"). Non-CJK segments pass through untouched.
  const romanized = text.replace(
    /[一-鿿]+/g,
    (run) => ` ${pinyin(run, { toneType: "none" })} `,
  );
  return romanized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deterministic id for a book with no usable ISBN. */
export function slugForBook(title: string, authors: string[]): string {
  const base = pinyinSlug(title).slice(0, 40) || "book";
  return `${base}-${shortHash(title + "|" + authors.join(","))}`;
}

/** Fold a scanning app's noisy category onto the curated taxonomy. */
const CATEGORY_MAP: Record<string, string> = {
  小说: "文学",
  文学: "文学",
  外国文学: "文学",
  中国文学: "文学",
  诗歌: "文学",
  散文: "文学",
  历史: "历史",
  中国史: "历史",
  世界史: "历史",
  传记: "历史",
  社会科学: "社科",
  社科: "社科",
  社会学: "社科",
  经济: "社科",
  政治: "社科",
  心理: "社科",
  哲学: "哲学",
  宗教: "哲学",
  艺术: "艺术",
  绘画: "艺术",
  建筑: "艺术",
  音乐: "艺术",
  设计: "艺术",
  摄影: "艺术",
  童书: "童书",
  儿童: "童书",
  绘本: "童书",
  少儿: "童书",
  科普: "科普",
  科学: "科普",
  自然科学: "科普",
  技术: "科普",
  计算机: "科普",
};

export function mapCategory(raw: string): string | undefined {
  const t = (raw ?? "").trim();
  if (!t) return undefined;
  return CATEGORY_MAP[t] ?? t; // unknown categories pass through unchanged
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  subtitle?: string;
  author?: string[];
  translator?: string[];
  publisher?: string;
  pubYear?: number;
  category?: string;
  tags?: string[];
  language: "zh" | "en" | "other";
  cover?: string;
  note?: string;
}

/** Serialize a record with a stable key order, dropping empty optionals. */
export function orderBook(b: Book): Book {
  const out: Record<string, unknown> = { id: b.id };
  if (b.isbn) out.isbn = b.isbn;
  out.title = b.title;
  if (b.subtitle) out.subtitle = b.subtitle;
  if (b.author && b.author.length) out.author = b.author;
  if (b.translator && b.translator.length) out.translator = b.translator;
  if (b.publisher) out.publisher = b.publisher;
  if (b.pubYear) out.pubYear = b.pubYear;
  if (b.category) out.category = b.category;
  if (b.tags && b.tags.length) out.tags = b.tags;
  out.language = b.language;
  if (b.cover) out.cover = b.cover;
  if (b.note) out.note = b.note;
  return out as unknown as Book;
}
