import { Router, Request, Response } from 'express';
import { ServiceContainer } from '../config/serviceContainer';

export const searchRoutes = Router();

// Semantic search endpoints
searchRoutes.post('/semantic', async (req: Request, res: Response) => {
  try {
    const { query, userId, chatId, topK = 10, minSimilarity = 0.7 } = req.body;

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const container = ServiceContainer.getInstance();
    const semanticSearchService = container.getChatSemanticSearchService();

    const results = await semanticSearchService.searchSimilarMessages(query, {
      userId,
      chatId,
      topK,
      minSimilarity
    });

    res.json({
      success: true,
      results,
      query,
      totalResults: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

searchRoutes.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { query, userId, topK = 5 } = req.body;

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Query is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const container = ServiceContainer.getInstance();
    const semanticSearchService = container.getChatSemanticSearchService();

    const results = await semanticSearchService.findSimilarConversations(query, userId, topK);

    res.json({
      success: true,
      conversations: results,
      query,
      totalConversations: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error finding similar conversations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

searchRoutes.post('/context', async (req: Request, res: Response) => {
  try {
    const { query, userId, currentChatId, contextSize = 5 } = req.body;

    if (!query || !userId) {
      res.status(400).json({
        success: false,
        error: 'Query and userId are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const container = ServiceContainer.getInstance();
    const semanticSearchService = container.getChatSemanticSearchService();

    const context = await semanticSearchService.getConversationContext(
      query, 
      userId, 
      currentChatId, 
      contextSize
    );

    res.json({
      success: true,
      context,
      query,
      userId,
      contextSize: context.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error getting conversation context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

searchRoutes.post('/index-chat/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    const container = ServiceContainer.getInstance();
    const semanticSearchService = container.getChatSemanticSearchService();

    await semanticSearchService.indexChatHistory(chatId);

    res.json({
      success: true,
      message: `Chat ${chatId} indexed for semantic search`,
      chatId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error indexing chat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}); 