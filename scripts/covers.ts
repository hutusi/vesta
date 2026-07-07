/**
 * Download the cover URLs recorded by ingest.ts, optimize them, and commit them
 * locally — so the site never hot-links external covers (which rot, get
 * hotlink-blocked, or vanish; fatal for a 10-year site).
 *
 *   bun run covers                 # fetch covers listed in src/data/covers-src.json
 *   bun run covers --force         # re-fetch even books that already have a cover
 *   bun run covers path/to/catalog.json out/dir
 *
 * Each cover is resized and re-encoded to WebP into public/covers/<id>.webp,
 * and catalog.json's `cover` field is set to /covers/<id>.webp. Commit both.
 * Books whose download fails keep no cover and fall back to the typographic
 * placeholder — nothing ever renders a broken image.
 */
import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";
import { orderBook, type Book } from "./lib.ts";

const WIDTH = 400;
const QUALITY = 80;
const CONCURRENCY = 8;

async function main() {
  const [, , catalogArg, outDirArg] = process.argv;
  const catalogPath =
    catalogArg && !catalogArg.startsWith("--") ? catalogArg : "src/data/catalog.json";
  const outDir =
    outDirArg && !outDirArg.startsWith("--") ? outDirArg : "public/covers";
  const coversSrcPath = join(dirname(catalogPath), "covers-src.json");
  const force = process.argv.includes("--force");

  const catalog: Book[] = JSON.parse(await Bun.file(catalogPath).text());

  const srcFile = Bun.file(coversSrcPath);
  if (!(await srcFile.exists())) {
    console.log(`No ${coversSrcPath} found — nothing to fetch.`);
    return;
  }
  const coverSrc: Record<string, string> = JSON.parse(await srcFile.text());
  await mkdir(outDir, { recursive: true });

  const byId = new Map(catalog.map((b) => [b.id, b]));
  const jobs = Object.entries(coverSrc).filter(([id]) => {
    const b = byId.get(id);
    return b && (force || !b.cover);
  });
  console.log(`${jobs.length} cover(s) to fetch → ${outDir}`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ([id, url]) => {
        const safe = id.replace(/[^a-z0-9._-]/gi, "_");
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          const webp = await sharp(buf)
            .resize({ width: WIDTH, withoutEnlargement: true })
            .webp({ quality: QUALITY })
            .toBuffer();
          await Bun.write(join(outDir, `${safe}.webp`), webp);
          byId.get(id)!.cover = `/covers/${safe}.webp`;
          ok++;
        } catch (e) {
          fail++;
          console.warn(`  ✗ ${id}: ${(e as Error).message}`);
        }
      }),
    );
  }

  await Bun.write(catalogPath, JSON.stringify(catalog.map(orderBook), null, 2) + "\n");
  console.log(`Localized ${ok} cover(s), ${fail} failed. Updated ${catalogPath}.`);
  console.log("Commit public/covers/ and the updated catalog.json.");
}

main();
