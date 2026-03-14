import { Chat, IChat, IMessage } from '../models/Chat';
import { v4 as uuidv4 } from 'uuid';
import { Service } from '../factory/IServiceFactory';

export class ChatService implements Service {
  
  /**
   * Get all chats with optional filtering and pagination
   */
  async getAllChats(
    userId?: string, 
    limit: number = 20, 
    page: number = 1
  ): Promise<{ chats: IChat[], total: number, pagination: any }> {
    try {
      const filter: any = {};
      if (userId) {
        filter.user_id = userId;
      }
      
      const skip = (page - 1) * limit;
      
      const chats = await Chat.find(filter)
        .select('-__v')
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip);
      
      const total = await Chat.countDocuments(filter);
      
      return {
        chats,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch chats: ${error}`);
    }
  }

  /**
   * Get chat by chat ID
   */
  async getChatById(chatId: string): Promise<IChat | null> {
    try {
      const chat = await Chat.findOne({ chat_id: chatId }).select('-__v');
      return chat;
    } catch (error) {
      throw new Error(`Failed to fetch chat: ${error}`);
    }
  }

  /**
   * Create a new chat
   */
  async createChat(
    userId: string, 
    modelName: string, 
    initialMessage?: string
  ): Promise<IChat> {
    try {
      // Validate required fields
      if (!userId || !modelName) {
        throw new Error('user_id and model_name are required');
      }

      // Create initial chat history if message provided
      const chatHistory: IMessage[] = [];
      if (initialMessage) {
        chatHistory.push({
          role: 'user',
          content: initialMessage,
          timestamp: new Date(),
        });
      }

      // Create new chat
      const newChat = new Chat({
        user_id: userId,
        chat_id: uuidv4(),
        model_name: modelName,
        chat_history: chatHistory,
      });

      const savedChat = await newChat.save();
      return savedChat;
    } catch (error) {
      throw new Error(`Failed to create chat: ${error}`);
    }
  }

  /**
   * Add message to existing chat
   */
  async addMessageToChat(
    chatId: string, 
    role: 'user' | 'assistant' | 'system', 
    content: string
  ): Promise<IChat> {
    try {
      // Validate required fields
      if (!role || !content) {
        throw new Error('role and content are required');
      }

      // Validate role
      if (!['user', 'assistant', 'system'].includes(role)) {
        throw new Error('role must be one of: user, assistant, system');
      }

      const newMessage: IMessage = {
        role,
        content,
        timestamp: new Date(),
      };

      const updatedChat = await Chat.findOneAndUpdate(
        { chat_id: chatId },
        { $push: { chat_history: newMessage } },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedChat) {
        throw new Error('Chat not found');
      }

      return updatedChat;
    } catch (error) {
      throw new Error(`Failed to add message: ${error}`);
    }
  }

  /**
   * Update chat model
   */
  async updateChat(chatId: string, modelName?: string): Promise<IChat> {
    try {
      const updateData: Partial<IChat> = {};
      if (modelName) updateData.model_name = modelName;

      const updatedChat = await Chat.findOneAndUpdate(
        { chat_id: chatId },
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedChat) {
        throw new Error('Chat not found');
      }

      return updatedChat;
    } catch (error) {
      throw new Error(`Failed to update chat: ${error}`);
    }
  }

  /**
   * Delete chat
   */
  async deleteChat(chatId: string): Promise<IChat> {
    try {
      const deletedChat = await Chat.findOneAndDelete({ chat_id: chatId });

      if (!deletedChat) {
        throw new Error('Chat not found');
      }

      return deletedChat;
    } catch (error) {
      throw new Error(`Failed to delete chat: ${error}`);
    }
  }

  /**
   * Get all chats for a specific user
   */
  async getChatsByUserId(
    userId: string, 
    limit: number = 20, 
    page: number = 1
  ): Promise<{ chats: IChat[], total: number, pagination: any }> {
    try {
      const skip = (page - 1) * limit;

      const chats = await Chat.find({ user_id: userId })
        .select('-__v')
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Chat.countDocuments({ user_id: userId });

      return {
        chats,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch user chats: ${error}`);
    }
  }

  /**
   * Get chat history by chat ID
   */
  async getChatHistory(chatId: string): Promise<IMessage[]> {
    try {
      const chat = await Chat.findOne({ chat_id: chatId }).select('chat_history');
      
      if (!chat) {
        throw new Error('Chat not found');
      }

      return chat.chat_history;
    } catch (error) {
      throw new Error(`Failed to fetch chat history: ${error}`);
    }
  }

  /**
   * Clear chat history (keep chat but remove messages)
   */
  async clearChatHistory(chatId: string): Promise<IChat> {
    try {
      const updatedChat = await Chat.findOneAndUpdate(
        { chat_id: chatId },
        { $set: { chat_history: [] } },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedChat) {
        throw new Error('Chat not found');
      }

      return updatedChat;
    } catch (error) {
      throw new Error(`Failed to clear chat history: ${error}`);
    }
  }
} 