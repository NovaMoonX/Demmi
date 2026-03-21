import type { IpcMain } from 'electron';
import * as cheerio from 'cheerio';
import type { UrlMetadata } from '../../src/lib/ipc/ipc.types';

const USER_AGENT = 'Demmi/1.0 (+https://github.com/NovaMoonX/Demmi)';
const FETCH_TIMEOUT_MS = 10_000;

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function attr($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const sel of selectors) {
    const [element, attribute] = sel.split('@');
    const val = attribute
      ? $(element).first().attr(attribute)
      : $(element).first().text().trim();
    if (val) return val;
  }
  return null;
}

export function registerWebpageHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    'fetch-url-metadata',
    async (_event, url: string): Promise<UrlMetadata> => {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      return {
        url,
        title: attr($, [
          'meta[property="og:title"]@content',
          'meta[name="twitter:title"]@content',
          'title',
        ]),
        description: attr($, [
          'meta[property="og:description"]@content',
          'meta[name="description"]@content',
          'meta[name="twitter:description"]@content',
        ]),
        image: attr($, [
          'meta[property="og:image"]@content',
          'meta[name="twitter:image"]@content',
        ]),
        siteName: attr($, [
          'meta[property="og:site_name"]@content',
        ]),
        author: attr($, [
          'meta[name="author"]@content',
          'meta[property="article:author"]@content',
          '[rel="author"]',
        ]),
        date: attr($, [
          'meta[property="article:published_time"]@content',
          'meta[name="date"]@content',
          'time[datetime]@datetime',
          'time',
        ]),
      };
    },
  );
}
