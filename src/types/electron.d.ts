// Type definitions for Electron API exposed via preload
import { ChatMessage } from '../renderer/components/chatWindow';

export interface ElectronAPI {
  platform: string;
  versions: NodeJS.ProcessVersions;
  sendMessage: (message: ChatMessage) => Promise<{
    response: string;
    timestamp: string;
    chatId?: string;
    error?: boolean;
  }>;
  getOpenaiModels: () => Promise<{
    models: string[];
    timestamp: string;
  }>;
  getPrompts: () => Promise<{
    prompts: string[];
    timestamp: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {}; 