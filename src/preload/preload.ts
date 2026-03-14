import { contextBridge, ipcRenderer } from 'electron';
import { ChatMessage } from '../renderer/components/chatWindow';

console.log('Preload script loading...');

// Expose API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,
  versions: process.versions,
  
  // Chat functionality
  sendMessage: (message: ChatMessage) => {
    console.log('sendMessage called with:', message);
    return ipcRenderer.invoke('send-message', message);
  },
  
  // Models functionality
  getOpenaiModels: () => {
    console.log('getOpenaiModels called');
    return ipcRenderer.invoke('get-openai-models');
  },
  getPrompts: () => {
    console.log('getPrompts called');
    return ipcRenderer.invoke('get-prompts');
  },
  
  // Global shortcut functionality
  onFocusInput: (callback: () => void) => {
    ipcRenderer.on('focus-chat-input', callback);
  },
  offFocusInput: (callback: () => void) => {
    ipcRenderer.off('focus-chat-input', callback);
  },
  onOpenCommandPalette: (callback: () => void) => {
    ipcRenderer.on('open-command-palette', callback);
  },
  offOpenCommandPalette: (callback: () => void) => {
    ipcRenderer.off('open-command-palette', callback);
  },
  
  // Main chat window functionality
  openMainChat: () => {
    return ipcRenderer.invoke('open-main-chat');
  }
});

console.log('Preload script loaded, electronAPI exposed');

// Add type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
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
        prompts: any[];
        timestamp: string;
      }>;
      onFocusInput: (callback: () => void) => void;
      offFocusInput: (callback: () => void) => void;
      onOpenCommandPalette: (callback: () => void) => void;
      offOpenCommandPalette: (callback: () => void) => void;
      openMainChat: () => Promise<void>;
    };
  }
} 