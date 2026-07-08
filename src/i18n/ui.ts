/**
 * Tiny hand-rolled i18n dictionary — no i18n library.
 *
 * The site is Chinese-first. English exists only for a couple of narrative
 * pages (about, visit); everything else (catalog, guestbook, donate) is
 * Chinese-only by design, so this dictionary stays small.
 */

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const languageNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export const ui = {
  zh: {
    'site.name': '只买书',
    'site.tagline': '乡村图书馆',
    'nav.home': '首页',
    'nav.about': '故事',
    'nav.catalog': '书目',
    'nav.visit': '到访',
    'nav.donate': '赠书',
    'nav.guestbook': '留言',
    'nav.menu': '菜单',
    'lang.toggle': 'English',
    'footer.honor': '无人值守 · 凭良心借还',
    'footer.rights': '自由取阅，欢迎传阅',
    'skip.content': '跳到主要内容',
  },
  en: {
    'site.name': 'Zhimaishu',
    'site.tagline': 'A Village Library',
    'nav.home': 'Home',
    'nav.about': 'Story',
    'nav.catalog': 'Catalog',
    'nav.visit': 'Visit',
    'nav.donate': 'Donate',
    'nav.guestbook': 'Guestbook',
    'nav.menu': 'Menu',
    'lang.toggle': '中文',
    'footer.honor': 'Unstaffed · borrow on your honor',
    'footer.rights': 'Free to read, please pass it on',
    'skip.content': 'Skip to main content',
  },
} as const;

export type UIKey = keyof (typeof ui)['zh'];

/** Returns a translator bound to a locale, falling back to Chinese. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui.zh[key];
  };
}

/**
 * Primary navigation. Links point at the canonical (Chinese) routes; items
 * that also have an English page carry `enHref`, used only on /en/ pages.
 */
export const navItems: ReadonlyArray<{
  key: UIKey;
  href: string;
  enHref?: string;
}> = [
  { key: 'nav.home', href: '/', enHref: '/en/' },
  { key: 'nav.about', href: '/about', enHref: '/en/about' },
  { key: 'nav.catalog', href: '/catalog' },
  { key: 'nav.visit', href: '/visit', enHref: '/en/visit' },
  { key: 'nav.donate', href: '/donate' },
  { key: 'nav.guestbook', href: '/guestbook' },
];
