
import { useState, useEffect } from 'react';
import ChatWindow from './components/chatWindow';
import CommandPalette from './components/CommandPalette';

function App(): JSX.Element {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Check if we're in quick chat mode or command palette mode
  const urlParams = new URLSearchParams(window.location.search);
  const isCommandPaletteMode = urlParams.get('mode') === 'commandpalette';
  // const isQuickChat = urlParams.get('mode') === 'quickchat';

  // In command palette mode, always keep it open
  const shouldShowCommandPalette = isCommandPaletteMode || isCommandPaletteOpen;

  // Handle keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+P (Mac) or Ctrl+P (Windows/Linux) - common shortcut for command palettes
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle global shortcut from main process
  useEffect(() => {
    const handleOpenCommandPalette = () => {
      setIsCommandPaletteOpen(true);
    };

    if (window.electronAPI && window.electronAPI.onOpenCommandPalette) {
      window.electronAPI.onOpenCommandPalette(handleOpenCommandPalette);
    }

    return () => {
      if (window.electronAPI && window.electronAPI.offOpenCommandPalette) {
        window.electronAPI.offOpenCommandPalette(handleOpenCommandPalette);
      }
    };
  }, []);

  // Auto-open command palette in command palette mode
  useEffect(() => {
    if (isCommandPaletteMode) {
      // Add CSS class to body for transparent background
      document.body.classList.add('command-palette-mode');
      // Set command palette open immediately for overlay mode
      setIsCommandPaletteOpen(true);
    } else {
      document.body.classList.remove('command-palette-mode');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('command-palette-mode');
    };
  }, [isCommandPaletteMode]);

  // if (isQuickChat) {
  //   return (
  //     <div className="h-screen w-screen flex items-center justify-center bg-transparent">
  //       <QuickChat />
  //     </div>
  //   );
  // }

  // If we're in command palette mode, only show the command palette
  if (isCommandPaletteMode) {
    console.log('Command palette mode detected, shouldShowCommandPalette:', shouldShowCommandPalette);
    return (
      <div className="h-screen w-screen" style={{ backgroundColor: 'transparent' }}>
        <CommandPalette 
          isOpen={shouldShowCommandPalette} 
          onClose={() => setIsCommandPaletteOpen(false)}
          isOverlay={true}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <ChatWindow/>
      <CommandPalette 
        isOpen={shouldShowCommandPalette} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
}

export default App; 