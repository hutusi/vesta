// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://zhimaishu.com',
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
