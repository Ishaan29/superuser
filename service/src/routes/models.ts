import { Router, Request, Response } from 'express';
import { OpenAIConnector } from '../connectors/openAIConnector';
import AntropicConnector from '../connectors/antropicConnector.langchain';

export const modelsRoutes = Router();

const openAIConnector = new OpenAIConnector();  
const antropicConnector = new AntropicConnector();

modelsRoutes.get('/openai', async (req: Request, res: Response) => {
  try {
    const models = await openAIConnector.getModels();
    const antropicModels = await antropicConnector.getModels();
    const allModels = [...models, ...antropicModels];
    
    res.json({
      models: allModels,
      timestamp: new Date().toISOString(),  
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: 'Failed to fetch models',
      timestamp: new Date().toISOString(),
    });
  }
}); 