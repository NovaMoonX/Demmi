import { contextBridge, ipcRenderer } from 'electron';
import type {
  ElectronAPI,
  OllamaChunkEvent,
  OllamaDoneEvent,
  OllamaErrorEvent,
} from '../src/lib/ipc/ipc.types';

const api: ElectronAPI = {
  fetchUrlMetadata: (url) => ipcRenderer.invoke('fetch-url-metadata', url),
  fetchRecipeContent: (url) => ipcRenderer.invoke('fetch-recipe-content', url),

  getOllamaUrl: () => ipcRenderer.invoke('config:get-ollama-url'),
  setOllamaUrl: (url) => ipcRenderer.invoke('config:set-ollama-url', url),
  testOllamaUrl: (url) => ipcRenderer.invoke('config:test-ollama-url', url),

  ollamaHealth: () => ipcRenderer.invoke('ollama:health'),
  listModels: () => ipcRenderer.invoke('ollama:list-models'),
  chat: (params) => ipcRenderer.invoke('ollama:chat', params),
  generate: (params) => ipcRenderer.invoke('ollama:generate', params),

  onOllamaChunk: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: OllamaChunkEvent) =>
      callback(data);
    ipcRenderer.on('ollama:chunk', handler);
    return () => ipcRenderer.removeListener('ollama:chunk', handler);
  },

  onOllamaDone: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: OllamaDoneEvent) =>
      callback(data);
    ipcRenderer.on('ollama:done', handler);
    return () => ipcRenderer.removeListener('ollama:done', handler);
  },

  onOllamaError: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: OllamaErrorEvent) =>
      callback(data);
    ipcRenderer.on('ollama:error', handler);
    return () => ipcRenderer.removeListener('ollama:error', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
