import type { ChatResponse, GenerateResponse, Message } from 'ollama';

export interface UrlMetadata {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  date: string | null;
}

export interface OllamaModel {
  name: string;
  model: string;
  modifiedAt: string;
  size: number;
  digest: string;
  details: {
    parentModel: string;
    format: string;
    family: string;
    families: string[] | null;
    parameterSize: string;
    quantizationLevel: string;
  };
}

export interface OllamaHealthResult {
  ok: boolean;
  error?: string;
}

export interface OllamaTestResult {
  ok: boolean;
  error?: string;
}

export interface OllamaChatParams {
  model: string;
  messages: Message[];
  stream?: boolean;
  format?: string | Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface OllamaGenerateParams {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: string | Record<string, unknown>;
  options?: Record<string, unknown>;
  system?: string;
}

export interface OllamaChunkEvent {
  type: 'chat' | 'generate';
  content: string;
  done: boolean;
  raw: object;
}

export interface OllamaDoneEvent {
  type: 'chat' | 'generate';
}

export interface OllamaErrorEvent {
  type: 'chat' | 'generate';
  error: string;
}

export interface ElectronAPI {
  fetchUrlMetadata(url: string): Promise<UrlMetadata>;
  fetchRecipeContent(url: string): Promise<string>;

  getOllamaUrl(): Promise<string>;
  setOllamaUrl(url: string): Promise<true>;
  testOllamaUrl(url: string): Promise<OllamaTestResult>;

  ollamaHealth(): Promise<OllamaHealthResult>;
  listModels(): Promise<OllamaModel[]>;

  /**
   * Chat request.
   * - `stream: false` (default) → resolves with the full `ChatResponse`.
   * - `stream: true`  → pushes `ollama:chunk` / `ollama:done` / `ollama:error`
   *   events; resolves with `null` when the stream finishes.
   */
  chat(params: OllamaChatParams): Promise<ChatResponse | null>;

  /**
   * Text-generation request.
   * - `stream: false` (default) → resolves with the full `GenerateResponse`.
   * - `stream: true`  → pushes `ollama:chunk` / `ollama:done` / `ollama:error`
   *   events; resolves with `null` when the stream finishes.
   */
  generate(params: OllamaGenerateParams): Promise<GenerateResponse | null>;

  onOllamaChunk(callback: (data: OllamaChunkEvent) => void): () => void;
  onOllamaDone(callback: (data: OllamaDoneEvent) => void): () => void;
  onOllamaError(callback: (data: OllamaErrorEvent) => void): () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
