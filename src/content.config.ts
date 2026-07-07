import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";

/**
 * Narrative markdown pages (about, visit) in both languages.
 * Files use a `.en` suffix for English, giving ids like `about` / `about.en`.
 */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    lang: z.enum(["zh", "en"]).default("zh"),
  }),
});

/**
 * Curated guestbook. Visitors submit through a third-party form; the founder
 * vets messages and appends approved ones here by hand. Newest-first display
 * is handled at render time. Each entry needs a unique `id`.
 */
const guestbook = defineCollection({
  loader: file("src/data/guestbook.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    message: z.string(),
    date: z.string(), // ISO date, e.g. "2026-06-15"
    location: z.string().optional(),
  }),
});

export const collections = { pages, guestbook };
