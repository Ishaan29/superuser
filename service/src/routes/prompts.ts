import { Router, Request, Response } from 'express';
import { ServiceContainer } from '../config/serviceContainer';
import { Prompt } from '../models/Prompt';
import PromptEvalService from '../services/promptEvalService';

export const promptsRoutes = Router();

// Get services from the container
const getServices = () => {
  const container = ServiceContainer.getInstance();
  return {
    promptExtracterService: container.getPromptExtracterService(),
    promptService: container.getPromptService()
  };
};

promptsRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { promptService } = getServices();
    const prompts = await promptService.getAllPrompts();
    res.json({
      prompts: prompts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting prompts:', error);
    res.status(500).json({
      error: 'Failed to get prompts',
      timestamp: new Date().toISOString(),
    });
  }
});

// Echo endpoint for testing
promptsRoutes.get('/echo', async (req: Request, res: Response) => {
  try {
    const { promptExtracterService, promptService } = getServices();
    const userId = "ec0c385b-13c0-4e40-85d2-b45bae2eb98c";
    const content = await promptExtracterService.extractPromptWithLangchain("ec0c385b-13c0-4e40-85d2-b45bae2eb98c");
    
    const prompt: Prompt = {
      user_id: userId,
      prompt_name: "Test Prompt",
      prompt_description: "Test Description",
      prompt_content: content,
      model_name: "gpt-4o",
    } as Prompt;

    const createdPrompt = await promptService.createPrompt(prompt);
    console.log(createdPrompt);
    console.log(createdPrompt.prompt_id);

    res.json({
      prompt: content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in echo endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Prompt evaluation test endpoint
promptsRoutes.get('/eval', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.query;
    const evalChatId = typeof chatId === 'string' ? chatId : "ec0c385b-13c0-4e40-85d2-b45bae2eb98c";
    
    console.log(`🚀 Starting prompt evaluation for chatId: ${evalChatId}`);
    
    const promptEvalService = new PromptEvalService();
    const evaluationResult = await promptEvalService.evaluatePrompt(evalChatId);
    
    res.json({
      success: true,
      chatId: evalChatId,
      evaluation: {
        generatedPrompt: evaluationResult.generatedPrompt,
        goldenPrompt: evaluationResult.goldenPrompt,
        heuristicScore: evaluationResult.heuristicScore,
        llmScore: evaluationResult.llmScore,
        finalEvaluation: evaluationResult.finalEvaluation
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in prompt evaluation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Prompt evaluation comparison endpoint (evaluate multiple prompts)
promptsRoutes.post('/eval-batch', async (req: Request, res: Response) => {
  try {
    const { chatIds } = req.body;
    
    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'chatIds array is required and must not be empty',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    console.log(`🚀 Starting batch prompt evaluation for ${chatIds.length} chats`);
    
    const promptEvalService = new PromptEvalService();
    const results = [];
    
    for (const chatId of chatIds) {
      try {
        console.log(`📊 Evaluating chat: ${chatId}`);
        const result = await promptEvalService.evaluatePrompt(chatId);
        results.push({
          chatId,
          success: true,
          evaluation: result.finalEvaluation,
          overallScore: result.finalEvaluation?.overallScore || 0
        });
      } catch (error) {
        console.error(`❌ Failed to evaluate chat ${chatId}:`, error);
        results.push({
          chatId,
          success: false,
          error: error instanceof Error ? error.message : 'Evaluation failed',
          overallScore: 0
        });
      }
    }
    
    // Sort by overall score (highest first)
    results.sort((a, b) => b.overallScore - a.overallScore);
    
    res.json({
      success: true,
      totalEvaluated: chatIds.length,
      successfulEvaluations: results.filter(r => r.success).length,
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in batch prompt evaluation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}); 