import { useState, useEffect } from 'react';
import FloatingMenu, { type FloatingMenuOption } from './floatingMenu';
import VariableEditor from './variableEditor';


interface SlashCommandProps {
  onClose?: () => void;
  onModelSelect?: (modelName: string) => void;
  onPromptSelect?: (prompt: string) => void;
  onSearchSelect?: (query: string) => void;
  onStreamSelect?: (streamType: string) => void;
}

type MenuState = 'main' | 'models' | 'prompts' | 'variableEditor' | 'search' | 'stream';

export default function SlashCommand({ onClose, onModelSelect, onPromptSelect, onSearchSelect, onStreamSelect }: SlashCommandProps) {
  const [currentMenu, setCurrentMenu] = useState<MenuState>('main');
  const [currentPromptTemplate, setCurrentPromptTemplate] = useState<string>('');
  const [currentVariables, setCurrentVariables] = useState<{ [key: string]: string }>({});
  const [openaiModels, setOpenaiModels] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);

  const handleModeSelect = () => {
    console.log('Modes selected - showing models menu');
    setCurrentMenu('models');
  };

  const handlePromptSelect = () => {
    console.log('Prompts selected - showing prompts menu');
    setCurrentMenu('prompts');
  };

  const handleUsageSelect = () => {
    console.log('Usage selected');
    // TODO: Implement usage selection logic
  };

  const handleSearchSelect = () => {
    console.log('Search selected - showing search menu');
    setCurrentMenu('search');
  };

  const handleStreamSelect = () => {
    console.log('Stream selected - showing stream menu');
    setCurrentMenu('stream');
  };

  const handleModelSelect = (modelName: string) => {
    console.log(`Model selected: ${modelName}`);
    onModelSelect?.(modelName);
  };

  const handlePromptOptionSelect = (prompt: string) => {
    console.log(`Prompt selected: ${prompt}`);
    
    // Clean the prompt string (remove quotes if present)
    let cleanPrompt = prompt.trim();
    // Remove leading and trailing quotes
    if (cleanPrompt.startsWith('"') && cleanPrompt.endsWith('"')) {
      cleanPrompt = cleanPrompt.slice(1, -1);
    }
    
    // Check if prompt contains variables - improved detection
    const variablePattern = /\{[^}]+\}/g;
    const matches = cleanPrompt.match(variablePattern);
    const hasVariables = matches && matches.length > 0;
    
    console.log('Clean prompt:', cleanPrompt);
    console.log('Variables detected:', matches);
    console.log('Has variables:', hasVariables);
    
    if (hasVariables) {
      // Open variable editor for prompts with variables
      console.log('Setting menu to variableEditor');
      setCurrentPromptTemplate(cleanPrompt);
      setCurrentVariables({});
      setCurrentMenu('variableEditor');
      console.log('Menu state should now be:', 'variableEditor');
      
      // Prevent immediate closing by stopping event propagation
      setTimeout(() => {
        console.log('Delayed check - current menu should be variableEditor');
      }, 100);
    } else {
      // Directly use prompts without variables
      console.log('No variables found, using prompt directly');
      onPromptSelect?.(cleanPrompt);
    }
  };

  const handleBackToMain = () => {
    setCurrentMenu('main');
  };

  const handleEmailPromptSelect = () => {
    const emailPrompt = 'Please help me refactor this email to make it more professional, clear, and well-structured. Improve the tone, grammar, and overall readability while maintaining the original message and intent.\n\nOriginal Email:\n{ORIGINAL_EMAIL}\n\nPlease provide the refactored version:';
    const emailVariables = {
      'ORIGINAL_EMAIL': 'Original Email Content'
    };
    
    setCurrentPromptTemplate(emailPrompt);
    setCurrentVariables(emailVariables);
    setCurrentMenu('variableEditor');
  };

  const handleVariableEditorComplete = (filledPrompt: string) => {
    onPromptSelect?.(filledPrompt);
  };

  const handleVariableEditorClose = () => {
    setCurrentMenu('prompts');
  };



  useEffect(() => {
    const fetchModels = async () => {
      const models = await getOpenaiModels();
      setOpenaiModels(models);
    };
    
    const fetchPromptsData = async () => {
      const promptsData = await fetchPrompts();
      setPrompts(promptsData.prompts || []);
    };
    
    fetchModels();
    fetchPromptsData();
  }, []);

  // get openai models 
  const getOpenaiModels = async () => {
    const response = await window.electronAPI.getOpenaiModels();
    console.log('Backend response:', response.models);
    return response.models;
  };

  // fetch prompts from the backend
  const fetchPrompts = async () => {
    const prompts = await window.electronAPI.getPrompts();
    console.log('Backend response:', prompts);
    return prompts;
  };

  // Define slash command options
  const slashCommandOptions: FloatingMenuOption[] = [
    {
      id: 'modes',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-purple-500">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      ),
      title: 'Modes',
      subtitle: 'Switch between different AI modes',
      onClick: handleModeSelect,
      hasSubmenu: true
    },
    {
      id: 'prompts',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-500">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      ),
      title: 'Prompts',
      subtitle: 'Use pre-built prompt templates',
      onClick: handlePromptSelect,
      hasSubmenu: true
    },
    {
      id: 'search',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-orange-500">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      ),
      title: 'Search',
      subtitle: 'Search through your chat history',
      onClick: handleSearchSelect,
      hasSubmenu: true
    },
    {
      id: 'stream',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-teal-500">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 10V3L4 14h7v7l9-11h-7z" 
          />
        </svg>
      ),
      title: 'Stream',
      subtitle: 'Stream your current screen, for helpful answers',
      onClick: handleStreamSelect,
      hasSubmenu: true
    },
    {
      id: 'usage',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-blue-500">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
      ),
      title: 'Usage',
      subtitle: 'View your AI usage statistics',
      onClick: handleUsageSelect
    }
  ];

  // Helper function to get model icon and color based on model name
  const getModelIcon = (modelName: string) => {
    const modelLower = modelName.toLowerCase();
    
    if (modelLower.includes('gpt-4')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    } else if (modelLower.includes('gpt-3.5')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (modelLower.includes('davinci') || modelLower.includes('text-davinci')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-purple-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    } else if (modelLower.includes('babbage') || modelLower.includes('curie') || modelLower.includes('ada')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-orange-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    } else {
      // Default icon for other models
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    }
  };

  // Helper function to get model description
  const getModelDescription = (modelName: string) => {
    const modelLower = modelName.toLowerCase();
    
    if (modelLower.includes('gpt-4')) {
      return 'Most capable model for complex tasks';
    } else if (modelLower.includes('gpt-3.5-turbo')) {
      return 'Fast and efficient for most tasks';
    } else if (modelLower.includes('gpt-3.5')) {
      return 'Good balance of capability and speed';
    } else if (modelLower.includes('davinci')) {
      return 'Most capable GPT-3 model';
    } else if (modelLower.includes('curie')) {
      return 'Very capable, faster than Davinci';
    } else if (modelLower.includes('babbage')) {
      return 'Capable of straightforward tasks';
    } else if (modelLower.includes('ada')) {
      return 'Fastest model, good for simple tasks';
    } else {
      return 'OpenAI language model';
    }
  };

  // Define AI models options dynamically from fetched models
  const aiModelsOptions: FloatingMenuOption[] = [
    {
      id: 'back',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ),
      title: 'Back',
      subtitle: 'Return to main menu',
      onClick: handleBackToMain
    },
    ...openaiModels.map((modelName) => ({
      id: modelName,
      icon: getModelIcon(modelName),
      title: modelName,
      subtitle: getModelDescription(modelName),
      onClick: () => handleModelSelect(modelName)
    }))
  ];

  // Helper function to get prompt icon based on content
  const getPromptIcon = (promptName: string, promptContent: string) => {
    const name = promptName.toLowerCase();
    const content = promptContent.toLowerCase();
    
    if (name.includes('code') || content.includes('code')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-purple-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    if (name.includes('debug') || content.includes('debug') || content.includes('bug')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-red-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    if (name.includes('review') || content.includes('review')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    }
    if (name.includes('test') || content.includes('test')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-600">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (name.includes('email') || content.includes('email')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-pink-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    if (name.includes('doc') || content.includes('document')) {
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-indigo-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    }
    // Default prompt icon
    return (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Define prompt templates options dynamically from fetched prompts
  const promptTemplatesOptions: FloatingMenuOption[] = [
    {
      id: 'back',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ),
      title: 'Back',
      subtitle: 'Return to main menu',
      onClick: handleBackToMain
    },
    ...prompts.map((prompt) => {
      // Check if this prompt has variables to determine if it needs submenu behavior
      const hasVariables = /\{[^}]+\}/.test(prompt.prompt_content);
      
      return {
        id: prompt.prompt_id || prompt.id,
        icon: getPromptIcon(prompt.prompt_name, prompt.prompt_content),
        title: prompt.prompt_name,
        subtitle: prompt.prompt_description || 'Custom prompt template',
        onClick: () => handlePromptOptionSelect(prompt.prompt_content),
        hasSubmenu: hasVariables // This prevents auto-close for prompts with variables
      };
    })
  ];

  // Search menu options
  const searchOptions: FloatingMenuOption[] = [
    {
      id: 'back',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ),
      title: 'Back',
      subtitle: 'Return to main menu',
      onClick: handleBackToMain
    },
    {
      id: 'semantic-search',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-purple-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Semantic Search',
      subtitle: 'Search by meaning across all conversations',
      onClick: () => {
        onSearchSelect?.('semantic');
        onClose?.();
      }
    },
    {
      id: 'conversation-search',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Find Similar Conversations',
      subtitle: 'Find conversations similar to a topic',
      onClick: () => {
        onSearchSelect?.('conversations');
        onClose?.();
      }
    },
    {
      id: 'context-search',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: 'Context Search',
      subtitle: 'Get relevant context from past conversations',
      onClick: () => {
        onSearchSelect?.('context');
        onClose?.();
      }
    }
  ];

  // Stream menu options
  const streamOptions: FloatingMenuOption[] = [
    {
      id: 'back',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ),
      title: 'Back',
      subtitle: 'Return to main menu',
      onClick: handleBackToMain
    },
    {
      id: 'enable-stream',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v1.586a1 1 0 00.293.707l2.414 2.414a1 1 0 01.293.707V16" />
        </svg>
      ),
      title: 'Enable Streaming',
      subtitle: 'Get real-time token-by-token responses',
      onClick: () => {
        onStreamSelect?.('enable');
        onClose?.();
      }
    },
    {
      id: 'disable-stream',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-red-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      title: 'Disable Streaming',
      subtitle: 'Return to standard response mode',
      onClick: () => {
        onStreamSelect?.('disable');
        onClose?.();
      }
    },
    {
      id: 'stream-settings',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Stream Settings',
      subtitle: 'Configure streaming preferences',
      onClick: () => {
        onStreamSelect?.('settings');
        onClose?.();
      }
    }
  ];

  const getCurrentOptions = () => {
    if (currentMenu === 'models') return aiModelsOptions;
    if (currentMenu === 'prompts') return promptTemplatesOptions;
    if (currentMenu === 'search') return searchOptions;
    if (currentMenu === 'stream') return streamOptions;
    return slashCommandOptions;
  };

  // Render different components based on current menu state
  console.log('Current menu state:', currentMenu);
  
  if (currentMenu === 'variableEditor') {
    console.log('Rendering VariableEditor with template:', currentPromptTemplate);
    return (
      <VariableEditor
        promptTemplate={currentPromptTemplate}
        variables={currentVariables}
        onComplete={handleVariableEditorComplete}
        onClose={handleVariableEditorClose}
      />
    );
  }

  console.log('Rendering FloatingMenu with options:', getCurrentOptions().length, 'options');
  return <FloatingMenu options={getCurrentOptions()} onClose={onClose} />;
}