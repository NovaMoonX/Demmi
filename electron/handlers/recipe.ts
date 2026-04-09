import type { IpcMain } from 'electron';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

const USER_AGENT = 'Demmi/1.0 (+https://github.com/NovaMoonX/Demmi)';
const FETCH_TIMEOUT_MS = 15_000;

/** Tags whose entire subtree should be stripped before extracting text. */
const STRIP_SELECTORS = [
  'nav',
  'header',
  'footer',
  'script',
  'style',
  'noscript',
  'aside',
  'iframe',
  '[class*="nav"]',
  '[class*="header"]',
  '[class*="footer"]',
  '[class*="sidebar"]',
  '[class*="advertisement"]',
  '[class*="banner"]',
  '[id*="nav"]',
  '[id*="header"]',
  '[id*="footer"]',
  '[id*="sidebar"]',
].join(', ');

/** Ordered list of selectors that are likely to contain the main content. */
const CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.recipe',
  '.recipe-card',
  '.recipe-content',
  '.recipe-body',
  '.wprm-recipe-container',
  '.tasty-recipes',
  '.post-content',
  '.entry-content',
  '.article-content',
];

export function registerRecipeHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    'fetch-recipe-content',
    async (_event, url: string): Promise<string> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let html: string;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
        html = await res.text();
      } finally {
        clearTimeout(timeout);
      }

      const $ = cheerio.load(html);

      // Remove noise elements
      $(STRIP_SELECTORS).remove();

      // Try progressively broader content selectors
      let container: cheerio.Cheerio<AnyNode> | null = null;
      for (const sel of CONTENT_SELECTORS) {
        const el = $(sel).first();
        if (el.length) {
          container = el;
          break;
        }
      }

      const text = (container ?? $('body')).text();
      return text.replace(/\s+/g, ' ').trim();
    },
  );
}
