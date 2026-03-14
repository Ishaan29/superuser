import { useEffect, useState, useRef } from "react";
import SlashCommand from "./slashCommand";

export interface ChatMessage {
    text: string;
    isUser: boolean;
    timestamp: string;
    userId: string;
    newChat: boolean;
    modelName: string;
    chatId?: string;
}

export default function ChatWindow() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showSlashCommand, setShowSlashCommand] = useState(false);
    const slashCommandRef = useRef<HTMLDivElement>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [isNewChat, setIsNewChat] = useState(true);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [streamMode, setStreamMode] = useState<string | null>(null);

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log('handleMessageChange called with value:', value);
        setMessage(value);
        
        // Close slash command if user types something other than '/' or removes '/'
        if (showSlashCommand && !value.startsWith('/')) {
            setShowSlashCommand(false);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        console.log('Key pressed:', e.key);
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (showSlashCommand) {
                setShowSlashCommand(false);
            } else {
                handleMessageSubmit();
            }
        }
        if (e.key === '/') {
            console.log('Slash command detected');
            setShowSlashCommand(true);            
        }
        if (e.key === 'Escape') {
            setShowSlashCommand(false);
        }
        if (e.key === 'Backspace' && showSlashCommand && message === '/') {
            setShowSlashCommand(false);
        }
    }

    const handleMessageSubmit = async () => {
        if (!message.trim()) return;

        // If in search mode, perform search instead of regular chat
        if (searchMode) {
            const userSearchMessage: ChatMessage = {
                text: `🔍 Searching for: "${message.trim()}" (${searchMode} search)`,
                isUser: true,
                userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
                newChat: false,
                timestamp: new Date().toISOString(),
                modelName: "search"
            };

            setMessages(prev => [...prev, userSearchMessage]);
            const searchQuery = message.trim();
            setMessage("");
            
            await performSearch(searchQuery);
            return;
        }

        // Check if electronAPI is available
        if (!window.electronAPI || !window.electronAPI.sendMessage) {
            console.error('electronAPI not available');
            alert('Electron API not available. Please restart the application.');
            return;
        }

        const userMessage: ChatMessage = {
            text: message.trim(),
            isUser: true,
            userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
            newChat: isNewChat,
            timestamp: new Date().toISOString(),
            modelName: selectedModel || "gpt-4o-mini",
            chatId: currentChatId || undefined
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setMessage("");
        setIsLoading(true);

        // After first message, set isNewChat to false
        if (isNewChat) {
            setIsNewChat(false);
            console.log('isNewChat set to false');
        }

        try {
            // Send message to backend via Electron IPC
            console.log('Sending message:', userMessage);
            const response = await window.electronAPI.sendMessage(userMessage);
            
            // If this was a new chat, capture the chatId
            if (isNewChat && response.chatId) {
                setCurrentChatId(response.chatId);
                console.log('New chat ID captured:', response.chatId);
            }
            
            const aiMessage: ChatMessage = {
                text: response.response,
                isUser: false,
                timestamp: response.timestamp,
                userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
                newChat: false,
                modelName: selectedModel || "gpt-4o-mini",
                chatId: currentChatId || response.chatId
            };

            // Add AI response
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            
            const errorMessage: ChatMessage = {
                text: "Sorry, I'm having trouble connecting right now. Please try again.",
                isUser: false,
                timestamp: new Date().toISOString(),
                userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
                newChat: false,
                modelName: selectedModel || "gpt-4o-mini"
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }

    // Close slash command when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showSlashCommand && 
                slashCommandRef.current && 
                !slashCommandRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)) {
                setShowSlashCommand(false);
            }
        };

        if (showSlashCommand) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSlashCommand]);

    // Handle global shortcut to focus input
    useEffect(() => {
        const handleFocusInput = () => {
            // Focus the input field
            if (inputRef.current) {
                inputRef.current.focus();
                console.log('Chat input focused via global shortcut');
            }
        };

        // Listen for the focus message from main process
        if (window.electronAPI && (window.electronAPI as any).onFocusInput) {
            (window.electronAPI as any).onFocusInput(handleFocusInput);
        }

        return () => {
            // Cleanup if needed
            if (window.electronAPI && (window.electronAPI as any).offFocusInput) {
                (window.electronAPI as any).offFocusInput(handleFocusInput);
            }
        };
    }, []);

    // Function to close slash command (can be passed to SlashCommand component)
    const closeSlashCommand = () => {
        setShowSlashCommand(false);
    };

    // Function to handle model selection
    const handleModelSelect = (modelName: string) => {
        setSelectedModel(modelName);
        setShowSlashCommand(false);
        setMessage(""); // Clear the "/" from input
        console.log(`Model selected: ${modelName}`);
    };

    // Function to remove selected model
    const removeSelectedModel = () => {
        setSelectedModel(null);
    };

    // Function to handle prompt selection
    const handlePromptSelect = (prompt: string) => {
        setMessage(prompt);
        setShowSlashCommand(false);
        console.log(`Prompt injected: ${prompt}`);
        // Focus the input after injecting the prompt
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    // Function to handle search selection
    const handleSearchSelect = (searchType: string) => {
        setSearchMode(searchType);
        setShowSlashCommand(false);
        setMessage(""); // Clear the "/" from input
        console.log(`Search mode selected: ${searchType}`);
        
        // Focus the input for search query
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    // Function to handle stream selection
    const handleStreamSelect = (streamType: string) => {
        console.log(`Stream mode selected: ${streamType}`);
        
        if (streamType === 'enable') {
            setStreamMode('enabled');
        } else if (streamType === 'disable') {
            setStreamMode(null);
        } else if (streamType === 'settings') {
            setStreamMode('settings');
        }
        
        setShowSlashCommand(false);
        setMessage(""); // Clear the "/" from input
        
        // Focus the input after stream selection
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    // Function to perform search based on search mode
    const performSearch = async (query: string) => {
        if (!searchMode || !query.trim()) return;

        setIsLoading(true);
        setSearchResults([]);

        try {
            let endpoint = '';
            let payload: any = {
                query: query.trim(),
                userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2"
            };

            switch (searchMode) {
                case 'semantic':
                    endpoint = '/search/semantic';
                    break;
                case 'conversations':
                    endpoint = '/search/conversations';
                    break;
                case 'context':
                    endpoint = '/search/context';
                    payload.currentChatId = currentChatId || undefined;
                    payload.contextSize = 5;
                    break;
                default:
                    console.error('Unknown search mode:', searchMode);
                    return;
            }

            console.log(`Performing ${searchMode} search with query: ${query}`);
            
            // Check if electronAPI has search functionality
            if (!window.electronAPI || typeof (window.electronAPI as any).searchMessages !== 'function') {
                throw new Error('Search functionality not available. Please update the application.');
            }
            
            // Call backend search API via Electron IPC
            const response = await (window.electronAPI as any).searchMessages(endpoint, payload);
            
            console.log('Search response:', response);
            setSearchResults(response.results || response.conversations || response.context || []);

            // Add search results as a special message
            const searchMessage: ChatMessage = {
                text: `🔍 Search Results for "${query}" (${searchMode} search):\n\n` + 
                      formatSearchResults(response.results || response.conversations || response.context || []),
                isUser: false,
                timestamp: new Date().toISOString(),
                userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
                newChat: false,
                modelName: "search"
            };

            setMessages(prev => [...prev, searchMessage]);
            
        } catch (error) {
            console.error('Error performing search:', error);
            
            const errorMessage: ChatMessage = {
                text: `❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isUser: false,
                timestamp: new Date().toISOString(),
                userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
                newChat: false,
                modelName: "search"
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setSearchMode(null); // Reset search mode after search
        }
    };

    // Function to format search results for display
    const formatSearchResults = (results: any[]): string => {
        if (!results || results.length === 0) {
            return "No results found.";
        }

        return results.map((result, index) => {
            const similarity = result.similarity ? ` (${Math.round(result.similarity * 100)}% match)` : '';
            const timestamp = result.timestamp ? new Date(result.timestamp).toLocaleDateString() : '';
            return `${index + 1}. ${result.content}${similarity}\n   📅 ${timestamp}\n`;
        }).join('\n');
    };

    // Function to start a new chat
    const startNewChat = () => {
        setMessages([]);
        setIsNewChat(true);
        setCurrentChatId(null);
        setSelectedModel(null);
        setStreamMode(null);
        console.log('Started new chat');
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-white text-gray-900 font-['Inter',sans-serif]">
            {/* Messages area */}
            <div className="flex-1 p-6 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-3 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg text-sm leading-relaxed ${
                            msg.isUser 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                    <div className="mb-3 flex justify-start">
                        <div className="max-w-xs p-3 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg text-sm leading-relaxed">
                            <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <span className="text-gray-500">AI is thinking...</span>
                            </div>
                        </div>
                </div>
        )}
            </div>
            
            {/* Input area positioned at bottom */}
            <div className="p-6 bg-transparent relative">
                {/* SlashCommand positioned above input on the left */}
                {showSlashCommand && (
                    <div ref={slashCommandRef} className="absolute bottom-full left-10 mb-2 z-10">
                        <SlashCommand 
                            onClose={closeSlashCommand} 
                            onModelSelect={handleModelSelect}
                            onPromptSelect={handlePromptSelect}
                            onSearchSelect={handleSearchSelect}
                            onStreamSelect={handleStreamSelect}
                        />
                    </div>
                )}
                <div className="relative flex items-center bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 mx-4 mb-4">
                    {/* Model pill, Search mode indicator, or Stream mode indicator - positioned inside input on the left */}
                    {searchMode && (
                        <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>{searchMode} search</span>
                            <button 
                                onClick={() => setSearchMode(null)}
                                className="text-orange-500 hover:text-orange-700 ml-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    {streamMode && !searchMode && (
                        <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-teal-100 text-teal-700 rounded-md text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>streaming {streamMode}</span>
                            <button 
                                onClick={() => setStreamMode(null)}
                                className="text-teal-500 hover:text-teal-700 ml-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    {selectedModel && !searchMode && !streamMode && (
                        <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            <span>{selectedModel}</span>
                            <button 
                                onClick={removeSelectedModel}
                                className="text-blue-500 hover:text-blue-700 ml-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={message}
                        placeholder={
                            searchMode 
                                ? `Enter search query for ${searchMode} search...` 
                                : streamMode
                                    ? `Streaming ${streamMode} - Ask anything...`
                                    : selectedModel 
                                        ? `Ask ${selectedModel} anything...` 
                                        : "Ask AI anything... or / for commands"
                        }
                        onChange={handleMessageChange}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className={`flex-1 py-4 text-sm bg-transparent placeholder-gray-500 focus:outline-none rounded-xl disabled:opacity-50 ${
                            selectedModel || searchMode || streamMode ? 'px-2' : 'px-5'
                        }`}
                    />
                    <div className="flex items-center gap-2 pr-4">
                        {/* Document icon */}
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        {/* @ icon */}
                        {/* <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </button> */}
                        {/* User profile icon */}
                        {/* <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button> */}
                        {/* Send button (when there's text) */}
                        {message.trim() && (
                            <button 
                                onClick={handleMessageSubmit}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}