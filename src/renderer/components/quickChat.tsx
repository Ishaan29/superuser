// import { useEffect, useState, useRef } from "react";

// export default function QuickChat() {
//     const [message, setMessage] = useState("");
//     const [isLoading, setIsLoading] = useState(false);
//     const inputRef = useRef<HTMLInputElement>(null);

//     const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setMessage(e.target.value);
//     }

//     const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             handleMessageSubmit();
//         }
//         if (e.key === 'Escape') {
//             // Close the quick chat window
//             window.close();
//         }
//     }

//     const handleMessageSubmit = async () => {
//         if (!message.trim()) return;

//         // Check if electronAPI is available
//         if (!window.electronAPI || !window.electronAPI.sendMessage) {
//             console.error('electronAPI not available');
//             return;
//         }

//         setIsLoading(true);

//         try {
//             const userMessage = {
//                 text: message.trim(),
//                 isUser: true,
//                 userId: "77727f75-2cc7-4e77-8f39-ad384ec784e2",
//                 newChat: true,
//                 timestamp: new Date().toISOString(),
//                 modelName: "gpt-4o-mini"
//             };

//             // Send message to backend via Electron IPC
//             const response = await window.electronAPI.sendMessage(userMessage);
            
//             console.log('Quick chat response:', response);
            
//             // Open the main chat window with the conversation
//             if (window.electronAPI && (window.electronAPI as any).openMainChat) {
//                 await (window.electronAPI as any).openMainChat();
//             }
            
//             // Close the quick chat window
//             window.close();
            
//         } catch (error) {
//             console.error('Error sending message:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     }

//     // Handle global shortcut to focus input
//     useEffect(() => {
//         const handleFocusInput = () => {
//             if (inputRef.current) {
//                 inputRef.current.focus();
//                 console.log('Quick chat input focused via global shortcut');
//             }
//         };

//         // Listen for the focus message from main process
//         if (window.electronAPI && (window.electronAPI as any).onFocusInput) {
//             (window.electronAPI as any).onFocusInput(handleFocusInput);
//         }

//         // Auto-focus on mount
//         if (inputRef.current) {
//             inputRef.current.focus();
//         }

//         return () => {
//             if (window.electronAPI && (window.electronAPI as any).offFocusInput) {
//                 (window.electronAPI as any).offFocusInput(handleFocusInput);
//             }
//         };
//     }, []);

//     return (
//         <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50">
//             <div className="flex items-center px-4 py-3">
//                 {/* AI Icon */}
//                 <div className="flex-shrink-0 mr-3">
//                     <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
//                         <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
//                         </svg>
//                     </div>
//                 </div>

//                 {/* Input Field */}
//                 <input 
//                     ref={inputRef}
//                     type="text" 
//                     value={message}
//                     placeholder="Ask AI anything..."
//                     onChange={handleMessageChange}
//                     onKeyPress={handleKeyPress}
//                     disabled={isLoading}
//                     className="flex-1 text-lg bg-transparent placeholder-gray-500 focus:outline-none disabled:opacity-50"
//                 />

//                 {/* Loading or Send Indicator */}
//                 {isLoading ? (
//                     <div className="flex-shrink-0 ml-3">
//                         <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
//                     </div>
//                 ) : message.trim() && (
//                     <div className="flex-shrink-0 ml-3">
//                         <div className="w-6 h-6 text-gray-400">
//                             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                             </svg>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// } 