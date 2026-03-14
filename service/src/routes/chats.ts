import { Router, Request, Response } from 'express';
import { ChatService } from '../services/ChatService';

const router = Router();
const chatService = new ChatService();

// GET /api/chats - Get all chats (with optional user filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 20, page = 1 } = req.query;
    
    const result = await chatService.getAllChats(
      user_id as string,
      Number(limit),
      Number(page)
    );
    
    res.json({
      success: true,
      data: result.chats,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats',
    });
  }
});

// GET /api/chats/:chatId - Get chat by ID
router.get('/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const chat = await chatService.getChatById(chatId);
    
    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Chat not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat',
    });
  }
});

// POST /api/chats - Create new chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, model_name, initial_message } = req.body;
    
    const savedChat = await chatService.createChat(user_id, model_name, initial_message);
    
    res.status(201).json({
      success: true,
      data: savedChat,
      message: 'Chat created successfully',
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    
    if (error instanceof Error && error.message.includes('required')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create chat',
    });
  }
});

// POST /api/chats/:chatId/messages - Add message to chat
router.post('/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { role, content } = req.body;
    
    const updatedChat = await chatService.addMessageToChat(chatId, role, content);
    
    res.json({
      success: true,
      data: updatedChat,
      message: 'Message added successfully',
    });
  } catch (error) {
    console.error('Error adding message:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      
      if (error.message.includes('required') || error.message.includes('must be one of')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add message',
    });
  }
});

// PUT /api/chats/:chatId - Update chat
router.put('/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { model_name } = req.body;
    
    const updatedChat = await chatService.updateChat(chatId, model_name);
    
    res.json({
      success: true,
      data: updatedChat,
      message: 'Chat updated successfully',
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update chat',
    });
  }
});

// DELETE /api/chats/:chatId - Delete chat
router.delete('/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    
    const deletedChat = await chatService.deleteChat(chatId);
    
    res.json({
      success: true,
      message: 'Chat deleted successfully',
      data: deletedChat,
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat',
    });
  }
});

// GET /api/chats/user/:userId - Get all chats for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const result = await chatService.getChatsByUserId(
      userId,
      Number(limit),
      Number(page)
    );
    
    res.json({
      success: true,
      data: result.chats,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user chats',
    });
  }
});

// GET /api/chats/:chatId/history - Get chat history
router.get('/:chatId/history', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    
    const chatHistory = await chatService.getChatHistory(chatId);
    
    res.json({
      success: true,
      data: chatHistory,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history',
    });
  }
});

// DELETE /api/chats/:chatId/history - Clear chat history
router.delete('/:chatId/history', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    
    const updatedChat = await chatService.clearChatHistory(chatId);
    
    res.json({
      success: true,
      data: updatedChat,
      message: 'Chat history cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history',
    });
  }
});

export { router as chatRoutes }; 