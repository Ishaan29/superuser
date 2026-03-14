import { app, BrowserWindow, ipcMain, globalShortcut, screen } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment setup
process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Security
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
let quickChatWin: BrowserWindow | null = null;
let commandPaletteWin: BrowserWindow | null = null;
const preload = path.join(__dirname, 'preload.js');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

// Express server setup
const expressApp = express();
const PORT = 3002;
const BACKEND_URL = "http://localhost:3002";

function setupExpressServer(): void {
  // Middleware
  expressApp.use(helmet());
  expressApp.use(cors());
  expressApp.use(express.json());

  // Chat API endpoint
  expressApp.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    console.log('Received message:', req.body);

    // send the message to the backend
    const response = await axios.post(`${BACKEND_URL}/api/chat`, {
      message
    });
    console.log('Backend response:', response.data);
    res.json(response.data);
  });
  // get openai models
  expressApp.get('/api/models/openai', async (req, res) => {
    const response = await axios.get(`${BACKEND_URL}/api/models/openai`);
    console.log('Backend response:', response.data);
    res.json(response.data);
  });

  // Health check endpoint
  expressApp.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Start server
  expressApp.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

// IPC handlers for communication with renderer
function setupIPC(): void {
  ipcMain.handle('send-message', async (event, message: any) => {
    try {
      const response = await axios.post(`http://localhost:${PORT}/api/chat/smart`, {
        message
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending message to backend:', error);
      return { 
        response: "Sorry, I'm having trouble connecting to the server right now.", 
        timestamp: new Date().toISOString(),
        error: true 
      };
    }
  });

  ipcMain.handle('get-openai-models', async (event) => {
    try {
      const response = await axios.get(`http://localhost:${PORT}/api/models/openai`);
      
      return response.data;
    } catch (error) {
      console.error('Error getting OpenAI models:', error);
      return { 
        models: [],
        timestamp: new Date().toISOString(),
        error: true 
      };
    }
  });

  ipcMain.handle('get-prompts', async (event) => {
    try {
      const response = await axios.get(`http://localhost:${PORT}/api/prompts`);
      
      return response.data;
    } catch (error) {
      console.error('Error getting prompts:', error);
      return { 
        prompts: [],
        timestamp: new Date().toISOString(),
        error: true 
      };
    }
  });

  // Handle opening main chat window
  ipcMain.handle('open-main-chat', async (event) => {
    if (win) {
      win.show();
      win.focus();
      if (process.platform === 'darwin') {
        app.focus();
      }
    } else {
      await createWindow();
    }
    
    // Hide quick chat if visible
    if (quickChatWin && quickChatWin.isVisible()) {
      quickChatWin.hide();
    }
  });
}

async function createWindow(): Promise<void> {
  win = new BrowserWindow({
    title: 'Proto Super User', // change this to white color almost invisible navbar
    frame: false, // add mac os window controls
    titleBarStyle: 'hidden', // add mac os window controls
    trafficLightPosition: { x: 10, y: 10 }, // add mac os window controls
    autoHideMenuBar: true, // add mac os window controls
    width: 1920,
    height: 1080,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
}

async function createQuickChatWindow(): Promise<void> {
  quickChatWin = new BrowserWindow({
    title: 'Quick Chat',
    width: 600,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Center the window on screen
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  quickChatWin.setPosition(Math.round((width - 600) / 2), Math.round(height / 4));

  // Load the quick chat HTML
  if (VITE_DEV_SERVER_URL) {
    quickChatWin.loadURL(`${VITE_DEV_SERVER_URL}?mode=quickchat`);
  } else {
    // For production, we'll need to create a separate HTML file
    quickChatWin.loadFile(path.join(RENDERER_DIST, 'quickchat.html'));
  }

  // Hide when it loses focus
  quickChatWin.on('blur', () => {
    if (quickChatWin && quickChatWin.isVisible()) {
      quickChatWin.hide();
    }
  });

  // Handle window closed
  quickChatWin.on('closed', () => {
    quickChatWin = null;
  });
}

async function createCommandPaletteWindow(): Promise<void> {
  commandPaletteWin = new BrowserWindow({
    title: 'Command Palette',
    width: 900,
    height: 700,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    backgroundColor: '#00000000', // Fully transparent background
    vibrancy: 'hud', // macOS vibrancy effect
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  // Center the window on screen
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  commandPaletteWin.setPosition(Math.round((width - 900) / 2), Math.round(height / 8));

  // Load the command palette HTML
  if (VITE_DEV_SERVER_URL) {
    commandPaletteWin.loadURL(`${VITE_DEV_SERVER_URL}?mode=commandpalette`);
  } else {
    // For production, we'll need to create a separate HTML file or use the main one
    commandPaletteWin.loadFile(indexHtml);
  }

  // Hide when it loses focus
  commandPaletteWin.on('blur', () => {
    if (commandPaletteWin && commandPaletteWin.isVisible()) {
      commandPaletteWin.hide();
    }
  });

  // Handle window closed
  commandPaletteWin.on('closed', () => {
    commandPaletteWin = null;
  });
}

// Global shortcut function
function registerGlobalShortcuts(): void {
  // You can customize these shortcuts as needed:
  const shortcuts = [
    'CommandOrControl+Shift+A',  // CMD+Shift+A (primary)
    // 'CommandOrControl+Option+Space', // Alternative: CMD+Option+Space
    // 'CommandOrControl+Shift+C',      // Alternative: CMD+Shift+C for Chat
  ];

  shortcuts.forEach(shortcut => {
    const success = globalShortcut.register(shortcut, async () => {
      // Create command palette window if it doesn't exist
      if (!commandPaletteWin) {
        await createCommandPaletteWindow();
      }
      
      if (commandPaletteWin) {
        if (commandPaletteWin.isVisible()) {
          // If already visible, hide it
          commandPaletteWin.hide();
        } else {
          // Show and focus the command palette window
          commandPaletteWin.show();
          commandPaletteWin.focus();
          
          // Bring to front on macOS
          if (process.platform === 'darwin') {
            app.focus();
          }
          
          // Send message to renderer to open the command palette
          commandPaletteWin.webContents.send('open-command-palette');
        }
      }
    });

    if (success) {
      console.log(`Global shortcut registered: ${shortcut}`);
    } else {
      console.log(`Failed to register global shortcut: ${shortcut}`);
    }
  });
}

// App event listeners
app.whenReady().then(() => {
  setupExpressServer();
  setupIPC();
  createWindow();
  createQuickChatWindow(); // Pre-create but don't show
  createCommandPaletteWindow(); // Pre-create but don't show
  registerGlobalShortcuts();
});

app.on('window-all-closed', () => {
  // Don't quit the app if only the main window is closed but quick chat exists
  // This allows the global shortcut to still work
  const visibleWindows = BrowserWindow.getAllWindows().filter(win => win.isVisible());
  
  // Unregister all global shortcuts only if all windows are closed
  if (visibleWindows.length === 0) {
    globalShortcut.unregisterAll();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 