/**
 * Turn a book-scanning app export (e.g. 晒书房) into src/data/catalog.json.
 *
 *   bun run ingest                         # reads data/raw/*.csv → src/data/catalog.json
 *   bun run ingest input.csv out.json      # explicit paths (used by tests)
 *
 * The scanning app resolves ISBN → title/author/publisher/cover; this script
 * normalizes that export onto our schema: canonical ISBN-13 ids, deduped,
 * folded taxonomy, stable key order for clean diffs. Cover image URLs are set
 * aside in covers-src.json for scripts/covers.ts to fetch and localize.
 *
 * XLSX exports: save as CSV first (the parser here is CSV-only, no dep).
 * The column aliases below are the one part likely to need per-export tweaks.
 */
import { dirname, join } from "node:path";
import {
  parseCsv,
  pick,
  splitList,
  extractYear,
  normalizeIsbn,
  slugForBook,
  mapCategory,
  orderBook,
  type Book,
} from "./lib.ts";

const COL = {
  title: ["书名", "标题", "title", "name"],
  subtitle: ["副标题", "subtitle"],
  author: ["作者", "著者", "author"],
  translator: ["译者", "翻译", "translator"],
  isbn: ["isbn", "isbn13", "条形码", "条码", "国际标准书号"],
  publisher: ["出版社", "出版商", "publisher"],
  year: ["出版年", "出版日期", "出版时间", "年份", "pubdate", "year"],
  category: ["分类", "类别", "分类名", "category"],
  tags: ["标签", "tags"],
  cover: ["封面", "封面图", "封面链接", "封面地址", "图片", "cover", "image"],
  note: ["备注", "短评", "我的评价", "note", "remark"],
};

function hasCjk(s: string): boolean {
  return /[一-鿿]/.test(s);
}

async function readInputs(inputArg?: string): Promise<string> {
  if (inputArg) return await Bun.file(inputArg).text();
  const glob = new Bun.Glob("data/raw/*.csv");
  const parts: string[] = [];
  let count = 0;
  for await (const path of glob.scan(".")) {
    const text = await Bun.file(path).text();
    // Keep the header only from the first file; strip it from the rest.
    parts.push(count === 0 ? text : text.replace(/^[^\n]*\n/, ""));
    count++;
  }
  if (count === 0) {
    throw new Error(
      "No input found. Put a CSV export in data/raw/ or pass a file path.",
    );
  }
  console.log(`Read ${count} file(s) from data/raw/`);
  return parts.join("\n");
}

function buildRecord(row: Record<string, string>): Book | null {
  const title = pick(row, COL.title);
  if (!title) return null;

  const authors = splitList(pick(row, COL.author));
  const isbn = normalizeIsbn(pick(row, COL.isbn)) ?? undefined;
  const id = isbn ?? slugForBook(title, authors);

  const book: Book = {
    id,
    isbn,
    title,
    subtitle: pick(row, COL.subtitle) || undefined,
    author: authors,
    translator: splitList(pick(row, COL.translator)),
    publisher: pick(row, COL.publisher) || undefined,
    pubYear: extractYear(pick(row, COL.year)),
    category: mapCategory(pick(row, COL.category)),
    tags: splitList(pick(row, COL.tags)),
    language: hasCjk(title) ? "zh" : "en",
    note: pick(row, COL.note) || undefined,
  };
  return book;
}

async function main() {
  const [, , inputArg, outArg] = process.argv;
  const outPath = outArg ?? "src/data/catalog.json";
  const coversSrcPath = join(dirname(outPath), "covers-src.json");

  const rows = parseCsv(await readInputs(inputArg));
  console.log(`Parsed ${rows.length} rows.`);

  const byId = new Map<string, Book>();
  const coverSrc: Record<string, string> = {};
  let skipped = 0;
  let dupes = 0;
  let withIsbn = 0;

  for (const row of rows) {
    const book = buildRecord(row);
    if (!book) {
      skipped++;
      continue;
    }
    if (byId.has(book.id)) {
      dupes++;
      continue;
    }
    if (book.isbn) withIsbn++;
    byId.set(book.id, book);

    const cover = pick(row, COL.cover);
    if (/^https?:\/\//i.test(cover)) coverSrc[book.id] = cover;
  }

  const records = [...byId.values()]
    .sort((a, b) => a.title.localeCompare(b.title, "zh") || a.id.localeCompare(b.id))
    .map(orderBook);

  await Bun.write(outPath, JSON.stringify(records, null, 2) + "\n");
  console.log(
    `Wrote ${records.length} books → ${outPath} ` +
      `(${withIsbn} with ISBN, ${records.length - withIsbn} slug ids, ` +
      `${dupes} dupes skipped, ${skipped} rows without a title).`,
  );

  const coverCount = Object.keys(coverSrc).length;
  if (coverCount > 0) {
    await Bun.write(coversSrcPath, JSON.stringify(coverSrc, null, 2) + "\n");
    console.log(
      `Wrote ${coverCount} cover URLs → ${coversSrcPath}. Run \`bun run covers\` to localize them.`,
    );
  }
}

main();
