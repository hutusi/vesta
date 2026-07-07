// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkPangu from './src/lib/remark-pangu.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://zhimaishu.com',
  markdown: {
    // Astro 7 defaults to the native Sätteri processor, which can't run JS
    // remark plugins. Opt back into the unified/remark processor so our
    // 盘古之白 plugin (hairline CJK↔Latin spacing) runs at build time.
    processor: unified({ remarkPlugins: [remarkPangu] }),
  },
  // Chinese-first. English lives under /en/ and only exists for select pages
  // (about, visit); the default locale (zh) is served without a prefix.
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  vite: {
    // Tailwind v4 is wired through its Vite plugin. There is no
    // tailwind.config.js — theme lives in src/styles/global.css via @theme.
    plugins: [tailwindcss()],
  },
});
