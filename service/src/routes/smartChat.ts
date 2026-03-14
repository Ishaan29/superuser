import { Router, Request, Response } from 'express';
import { OpenAIConnector } from '../connectors/openAIConnector';
import { ServiceContainer } from '../config/serviceContainer';
import MessageRouterService from '../services/messageRouterService';

export const smartChatRoutes = Router();

const openAIConnector = new OpenAIConnector();

// Get services from the container
const getServices = () => {
  const container = ServiceContainer.getInstance();
  return {
    chatService: container.getChatService(),
    chatMemoryService: container.getChatMemoryService(),
  };
};


smartChatRoutes.post('/memory', async (req: Request, res: Response) => {
  try {
    const { chatService, chatMemoryService } = getServices();
    // const { chatId, message } = req.body;

    const summary = await chatMemoryService.getChatSummary("ec0c385b-13c0-4e40-85d2-b45bae2eb98c");

    res.json({
      summary: summary.summary,
    });


  }catch (error) {
    console.error('Error in memory endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }

});

// Basic chat endpoint (legacy)
smartChatRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { chatService } = getServices();
    const { message } = req.body;
    const { userId, newChat, modelName, text, chatId } = message;

    let currentChat;
    let chatHistory: any[] = [];

    if (newChat) {
      // Create a new chat with the initial message
      currentChat = await chatService.createChat(userId, modelName, text);
      console.log('New chat created:', currentChat);
      // For new chat, history is just the current user message
      chatHistory = [{ role: 'user', content: text }];
    } else {
      // Continue existing chat
      if (!chatId) {
        res.status(400).json({
          error: 'chatId is required for continuing conversations',
        });
        return;
      }
      
      // Get existing chat and add new message
      currentChat = await chatService.getChatById(chatId);
      if (!currentChat) {
        res.status(404).json({
          error: 'Chat not found',
        });
        return;
      }
      
      // Add user message to existing chat
      currentChat = await chatService.addMessageToChat(chatId, 'user', text);
      console.log('Message added to existing chat:', chatId);
      
      // Get full chat history for context
      chatHistory = currentChat.chat_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
    }
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({
        error: 'Message text is required and must be a string',
      });
      return;
    }

    // Get AI response with full context
    const response = await openAIConnector.chatWithHistory(chatHistory);
    
    // Add AI response to chat
    if (currentChat) {
      await chatService.addMessageToChat(currentChat.chat_id, 'assistant', response);
    }
    
    res.json({
      response: response,
      timestamp: new Date().toISOString(),
      messageId: Math.random().toString(36).substr(2, 9),
      chatId: currentChat ? currentChat.chat_id : null,
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Smart chat endpoint using LLM router
smartChatRoutes.post('/smart', async (req: Request, res: Response) => {
  try {
    const message = req.body.message || req.body;
    const { userId, newChat, modelName, text, chatId } = message;

    // Validate required fields
    if (!userId || !modelName || !text) {
      res.status(400).json({
        success: false,
        error: 'userId, modelName, and text are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log(`🤖 Smart chat request - Model: ${modelName}, User: ${userId}, New: ${newChat}`);

    // Instantiate MessageRouterService (lazy loading after container is initialized)
    const messageRouter = new MessageRouterService();
    
    // Route the message through the smart router
    const result = await messageRouter.routeMessage({
      userId,
      newChat: newChat || false,
      modelName,
      text,
      chatId
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in smart chat routing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Embedding endpoint for chat indexing
smartChatRoutes.get('/run-embedding', async (req: Request, res: Response) => {
  try {
    const container = ServiceContainer.getInstance();
    const semanticSearchService = container.getChatSemanticSearchService();
    const chatService = container.getChatService();

    // Get all chats (you might want to add pagination for production)
    const chatsResult = await chatService.getAllChats();
    const chats = chatsResult.chats;
    let indexedCount = 0;

    for (const chat of chats) {
      try {
        await semanticSearchService.indexChatHistory(chat.chat_id);
        indexedCount++;
      } catch (error) {
        console.error(`Failed to index chat ${chat.chat_id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Indexed ${indexedCount} chats for semantic search`,
      totalChats: chats.length,
      indexedChats: indexedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error running embedding on all chats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}); 