import { ServiceContainer } from "@/config/serviceContainer";
import { ServiceFactory } from "@/factory";
import { ChatService } from "./ChatService";
import LLMRouterService from "./llmRouterService";

class MessageRouterService {
    private readonly chatService: ChatService;
    private readonly serviceFactory: ServiceFactory;
    private readonly llmRouter: LLMRouterService;

    constructor() {
        this.serviceFactory = new ServiceFactory();
        const container = ServiceContainer.getInstance();
        this.chatService = container.getChatService();
        this.llmRouter = container.getLLMRouterService();
    }

    async routeMessage(messageModal: any) {
        const { userId, newChat, modelName, text, chatId } = messageModal;
        let currentChat;
        let chatHistory: any[] = [];

        if (newChat) {
            // Create a new chat with the initial message
            currentChat = await this.chatService.createChat(userId, modelName, text);
            console.log('New chat created:', currentChat);
            // For new chat, history is just the current user message
            chatHistory = [{ role: 'user', content: text }];
          } else {
            // Continue existing chat
            if (!chatId) {
                throw new Error('chatId is required for continuing conversations');
            }
            
            // Get existing chat and add new message
            currentChat = await this.chatService.getChatById(chatId);
            if (!currentChat) {
                throw new Error('Chat not found');
            }
            
            // Add user message to existing chat
            currentChat = await this.chatService.addMessageToChat(chatId, 'user', text);
            console.log('Message added to existing chat:', chatId);
            
            // Get full chat history for context
            chatHistory = currentChat.chat_history.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            }));
          }
          
          if (!text || typeof text !== 'string') {
            throw new Error('Message text is required and must be a string');
        }

        // Get provider info for the model
        const providerInfo = this.llmRouter.getProviderInfo(modelName);
        console.log(`Using ${providerInfo.provider} for model: ${providerInfo.model}`);

        // Get AI response with full context using the appropriate provider
        const response = await this.llmRouter.chatWithHistory(chatHistory, modelName);
        
        // Add AI response to chat
        if (currentChat) {
            await this.chatService.addMessageToChat(currentChat.chat_id, 'assistant', response);
        }

        return {
            chatId: currentChat.chat_id,
            response: response,
            provider: providerInfo.provider,
            model: modelName,
            newChat: newChat
        };
    }

}

export default MessageRouterService;
