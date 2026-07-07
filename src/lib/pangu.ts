/**
 * 盘古之白 — insert a thin breathing space between CJK characters and adjacent
 * Latin letters / numbers, e.g. "使用Astro构建2024" → "使用 Astro 构建 2024".
 *
 * Deliberately conservative: it only spaces CJK↔alphanumeric, never around
 * punctuation, so it can't mangle things like URLs, "3.14", or "COVID-19".
 * Runs at build time (see remark-pangu.ts); no runtime cost.
 */

// Common CJK blocks: kangxi radicals, kana, bopomofo, CJK symbols, unified
// ideographs (BMP + ext-A) and compatibility ideographs.
const CJK =
  '⺀-⻿⼀-⿟぀-ゟ゠-ヺー-ヿ' +
  '㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿';

const ALNUM = 'A-Za-z0-9';

const CJK_THEN_ALNUM = new RegExp(`([${CJK}])([${ALNUM}])`, 'g');
const ALNUM_THEN_CJK = new RegExp(`([${ALNUM}])([${CJK}])`, 'g');

export function pangu(text: string): string {
  if (!text) return text;
  return text
    .replace(CJK_THEN_ALNUM, '$1 $2')
    .replace(ALNUM_THEN_CJK, '$1 $2');
}
