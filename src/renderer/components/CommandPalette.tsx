import { useState, useEffect, useRef } from 'react';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'apps' | 'people' | 'files' | 'commands' | 'recent' | 'applications' | 'suggestions';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isOverlay?: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, isOverlay = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'apps' | 'people' | 'files' | 'commands'>('apps');
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Sample commands data
  const commands: Command[] = [
    // Apps
    {
      id: 'compose-email',
      title: 'Compose an Email',
      subtitle: 'Gmail',
      icon: <span className="text-red-500">📧</span>,
      shortcut: '⌘ ⇧ G',
      action: () => console.log('Compose email'),
      category: 'apps'
    },
    {
      id: 'manage-schedule',
      title: 'Manage my Schedule',
      subtitle: 'Calendar',
      icon: <span className="text-blue-500">📅</span>,
      shortcut: '⌘ ⇧ C',
      action: () => console.log('Manage schedule'),
      category: 'apps'
    },
    {
      id: 'create-doc',
      title: 'Create a Doc',
      subtitle: 'Notion',
      icon: <span className="text-gray-700">📄</span>,
      shortcut: '⌘ N',
      action: () => console.log('Create doc'),
      category: 'apps'
    },
    // Recent
    {
      id: 'my-inbox',
      title: 'My Inbox',
      subtitle: 'Gmail',
      icon: <span className="text-red-500">📧</span>,
      shortcut: '⌘ I',
      action: () => console.log('Open inbox'),
      category: 'recent'
    },
    {
      id: 'all-hands',
      title: 'All Hands — Shared',
      subtitle: 'Docs • Yesterday, 9:43am',
      icon: <span className="text-blue-500">📄</span>,
      action: () => console.log('Open all hands'),
      category: 'recent'
    },
    {
      id: 'new-task',
      title: 'New Task',
      subtitle: 'Todoist',
      icon: <span className="text-red-500">✅</span>,
      shortcut: '⌘ ⇧ N',
      action: () => console.log('New task'),
      category: 'recent'
    },
    // People
    {
      id: 'mike-dean',
      title: 'Mike Dean',
      subtitle: 'mike@compname.com',
      icon: <span className="text-gray-600">👤</span>,
      action: () => console.log('Contact Mike'),
      category: 'people'
    },
    // Applications
    {
      id: 'slack',
      title: 'Slack',
      icon: <span className="text-purple-500">💬</span>,
      shortcut: '⌘ 3',
      action: () => console.log('Open Slack'),
      category: 'applications'
    }
  ];

  const filteredCommands = commands.filter(command => {
    const matchesSearch = searchQuery === '' || 
      command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (command.subtitle && command.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = activeTab === 'apps' ? 
      ['apps', 'recent'].includes(command.category) : 
      command.category === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderSection = (title: string, items: Command[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </div>
        {items.map((command, index) => {
          const globalIndex = filteredCommands.indexOf(command);
          return (
            <div
              key={command.id}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                selectedIndex === globalIndex
                  ? 'bg-blue-50 border-r-2 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                command.action();
                onClose();
              }}
            >
              <div className="flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center">
                {command.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {command.title}
                </div>
                {command.subtitle && (
                  <div className="text-xs text-gray-500 truncate">
                    {command.subtitle}
                  </div>
                )}
              </div>
              {command.shortcut && (
                <div className="flex-shrink-0 ml-4 text-xs text-gray-400 font-mono">
                  {command.shortcut}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const appsCommands = filteredCommands.filter(cmd => cmd.category === 'apps');
  const recentCommands = filteredCommands.filter(cmd => cmd.category === 'recent');
  const peopleCommands = filteredCommands.filter(cmd => cmd.category === 'people');
  const filesCommands = filteredCommands.filter(cmd => cmd.category === 'files');
  const applicationsCommands = filteredCommands.filter(cmd => cmd.category === 'applications');

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center ${isOverlay ? 'pt-16' : 'pt-32'} px-4`}>
      {/* Backdrop - more visible in overlay mode */}
      <div 
        className={`absolute inset-0 ${isOverlay ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-25'}`} 
        onClick={onClose} 
      />
      
      {/* Palette */}
      <div
        ref={paletteRef}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search Header */}
        <div className="relative border-b border-gray-100">
          <div className="flex items-center px-4 py-4">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or type a command..."
              className="flex-1 text-lg placeholder-gray-400 bg-transparent border-none outline-none"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex border-t border-gray-100">
            {[
              { id: 'apps' as const, label: 'Apps' },
              { id: 'people' as const, label: 'People' },
              { id: 'files' as const, label: 'Files' },
              { id: 'commands' as const, label: 'Commands' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery === '' && activeTab === 'apps' && (
            <>
              {renderSection('AI Prompts', appsCommands)}
              {renderSection('Recent', recentCommands)}
              {renderSection('Applications', applicationsCommands)}
            </>
          )}
          
          {searchQuery === '' && activeTab === 'people' && (
            renderSection('People', peopleCommands)
          )}
          
          {searchQuery === '' && activeTab === 'files' && (
            renderSection('Files', filesCommands)
          )}
          
          {searchQuery === '' && activeTab === 'commands' && (
            renderSection('Commands', filteredCommands.filter(cmd => cmd.category === 'commands'))
          )}
          
          {searchQuery !== '' && (
            <>
              {appsCommands.length > 0 && renderSection('Apps', appsCommands)}
              {recentCommands.length > 0 && renderSection('Recent', recentCommands)}
              {peopleCommands.length > 0 && renderSection('People', peopleCommands)}
              {filesCommands.length > 0 && renderSection('Files', filesCommands)}
              {applicationsCommands.length > 0 && renderSection('Applications', applicationsCommands)}
            </>
          )}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="text-sm">No results found</div>
              <div className="text-xs mt-1">Try searching for something else</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">↵</kbd>
                <span>Open</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">P</kbd>
                <span>Toggle</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;