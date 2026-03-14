import { useState, useEffect, useRef } from 'react';

interface FloatingMenuOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  hasSubmenu?: boolean;
}

interface FloatingMenuProps {
  options: FloatingMenuOption[];
  onClose?: () => void;
  className?: string;
  onKeyNavigation?: (selectedIndex: number) => void;
  onEnterPressed?: (selectedOption: FloatingMenuOption) => void;
}

export default function FloatingMenu({ 
  options, 
  onClose, 
  className = "", 
  onKeyNavigation,
  onEnterPressed 
}: FloatingMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev < options.length - 1 ? prev + 1 : 0;
            onKeyNavigation?.(newIndex);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : options.length - 1;
            onKeyNavigation?.(newIndex);
            return newIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          const selectedOption = options[selectedIndex];
          if (selectedOption) {
            onEnterPressed?.(selectedOption);
            handleOptionClick(selectedOption);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, options, onKeyNavigation, onEnterPressed, onClose]);

  const handleOptionClick = (option: FloatingMenuOption) => {
    option.onClick();
    if (!option.hasSubmenu) {
      onClose?.();
    }
  };

  return (
    <div 
      ref={menuRef}
      className={`bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] max-h-[400px] overflow-y-auto ${className}`}
    >
      {options.map((option, index) => (
        <div 
          key={option.id}
          onClick={() => handleOptionClick(option)}
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
            index === selectedIndex 
              ? 'bg-blue-50 border-l-2 border-blue-500' 
              : 'hover:bg-gray-50'
          }`}
        >
          {/* Icon */}
          <div className="w-5 h-5">
            {option.icon}
          </div>
          
          {/* Text Content */}
          <div className="flex-1">
            <div className={`text-sm font-medium ${
              index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {option.title}
            </div>
            <div className={`text-xs ${
              index === selectedIndex ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {option.subtitle}
            </div>
          </div>
          
          {/* Submenu indicator */}
          {option.hasSubmenu && (
            <div className="w-4 h-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export type { FloatingMenuOption }; 