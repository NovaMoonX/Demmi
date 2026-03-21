import type { ElectronAPI, OllamaHealthResult } from './ipc.types';

export type { ElectronAPI };
export type {
  UrlMetadata,
  OllamaModel,
  OllamaHealthResult,
  OllamaTestResult,
  OllamaChatParams,
  OllamaGenerateParams,
  OllamaChunkEvent,
  OllamaDoneEvent,
  OllamaErrorEvent,
} from './ipc.types';

/**
 * Returns `true` when the renderer is running inside an Electron host that has
 * injected `window.electronAPI` via the preload contextBridge.
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && 'electronAPI' in window;
}

/**
 * Returns the typed `ElectronAPI` object exposed by the preload script, or
 * `null` when the app is not running inside Electron.
 */
export function getElectronAPI(): ElectronAPI | null {
  if (!isElectron()) return null;
  return window.electronAPI ?? null;
}

/**
 * Probes Ollama availability through the Electron IPC bridge.
 * Returns `null` (not available) when not running inside Electron.
 */
export async function checkOllamaAvailable(): Promise<OllamaHealthResult | null> {
  const api = getElectronAPI();
  if (!api) return null;
  try {
    return await api.ollamaHealth();
  } catch {
    return { ok: false, error: 'IPC call failed' };
  }
}
