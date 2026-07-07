import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

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

export const collections = { pages };
