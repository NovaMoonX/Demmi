import { app, type IpcMain, type WebContents } from 'electron';
import fs from 'fs';
import path from 'path';
import { Ollama } from 'ollama';
import type {
  OllamaHealthResult,
  OllamaModel,
  OllamaChatParams,
  OllamaGenerateParams,
  OllamaChunkEvent,
  OllamaDoneEvent,
  OllamaErrorEvent,
} from '../../src/lib/ipc/ipc.types';
import type { ChatResponse, GenerateResponse } from 'ollama';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const CONFIG_TIMEOUT_MS = 3_000;

interface DemmiConfig {
  ollamaUrl: string;
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'demmi-config.json');
}

function readConfig(): DemmiConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DemmiConfig>;
    return { ollamaUrl: parsed.ollamaUrl ?? DEFAULT_OLLAMA_URL };
  } catch {
    return { ollamaUrl: DEFAULT_OLLAMA_URL };
  }
}

function writeConfig(config: DemmiConfig): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}

function createClient(host?: string): Ollama {
  return new Ollama({ host: host ?? readConfig().ollamaUrl });
}

export function registerOllamaHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('config:get-ollama-url', (): string => {
    return readConfig().ollamaUrl;
  });

  ipcMain.handle('config:set-ollama-url', (_event, url: string): true => {
    writeConfig({ ollamaUrl: url });
    return true;
  });

  ipcMain.handle(
    'config:test-ollama-url',
    async (_event, url: string): Promise<OllamaHealthResult> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
          signal: controller.signal,
        });
        return { ok: res.ok };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  );

  ipcMain.handle('ollama:health', async (): Promise<OllamaHealthResult> => {
    const { ollamaUrl } = readConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
    try {
      const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, {
        signal: controller.signal,
      });
      return { ok: res.ok };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      clearTimeout(timeout);
    }
  });

  ipcMain.handle('ollama:list-models', async (): Promise<OllamaModel[]> => {
    const client = createClient();
    const response = await client.list();
    return response.models.map((m) => ({
      name: m.name,
      model: m.model,
      modifiedAt: m.modified_at instanceof Date ? m.modified_at.toISOString() : String(m.modified_at),
      size: m.size,
      digest: m.digest,
      details: {
        parentModel: m.details.parent_model,
        format: m.details.format,
        family: m.details.family,
        families: m.details.families ?? null,
        parameterSize: m.details.parameter_size,
        quantizationLevel: m.details.quantization_level,
      },
    }));
  });

  ipcMain.handle(
    'ollama:chat',
    async (
      event,
      params: OllamaChatParams,
    ): Promise<ChatResponse | null> => {
      const { stream = false, ...rest } = params;
      const client = createClient();

      if (!stream) {
        return client.chat({ ...rest, stream: false });
      }

      const sender: WebContents = event.sender;

      try {
        const chunks = await client.chat({ ...rest, stream: true });
        for await (const chunk of chunks) {
          const payload: OllamaChunkEvent = {
            type: 'chat',
            content: chunk.message.content,
            done: chunk.done,
            raw: chunk,
          };
          sender.send('ollama:chunk', payload);
        }
        const done: OllamaDoneEvent = { type: 'chat' };
        sender.send('ollama:done', done);
      } catch (err) {
        const error: OllamaErrorEvent = {
          type: 'chat',
          error: err instanceof Error ? err.message : String(err),
        };
        sender.send('ollama:error', error);
      }

      return null;
    },
  );

  ipcMain.handle(
    'ollama:generate',
    async (
      event,
      params: OllamaGenerateParams,
    ): Promise<GenerateResponse | null> => {
      const { stream = false, ...rest } = params;
      const client = createClient();

      if (!stream) {
        return client.generate({ ...rest, stream: false });
      }

      const sender: WebContents = event.sender;

      try {
        const chunks = await client.generate({ ...rest, stream: true });
        for await (const chunk of chunks) {
          const payload: OllamaChunkEvent = {
            type: 'generate',
            content: chunk.response,
            done: chunk.done,
            raw: chunk,
          };
          sender.send('ollama:chunk', payload);
        }
        const done: OllamaDoneEvent = { type: 'generate' };
        sender.send('ollama:done', done);
      } catch (err) {
        const error: OllamaErrorEvent = {
          type: 'generate',
          error: err instanceof Error ? err.message : String(err),
        };
        sender.send('ollama:error', error);
      }

      return null;
    },
  );
}
