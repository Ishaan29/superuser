import LangchainConnector from "@/connectors/langchainConnector";
import { PromptExtracterService } from "./PromptExtracterService";
import { Service } from "../factory/IServiceFactory";
import { ServiceFactory } from "../factory/ServiceFactory";
import PromptService from "./promptService";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import AntropicConnector from "@/connectors/antropicConnector.langchain";
import { ChatAnthropic } from "@langchain/anthropic";

interface EvaluationState {
    chatHistory: any[];
    systemPrompt: string;
    generatedPrompt: string;
    goldenPrompt?: string;
    heuristicScore?: HeuristicScore;
    llmScore?: LLMScore;
    finalEvaluation?: FinalEvaluation;
}

interface HeuristicScore {
    lengthScore: number; // 0-10
    formatScore: number; // 0-10 
    variableScore: number; // 0-10
    structureScore: number; // 0-10
    totalScore: number;
    details: string[];
}

interface LLMScore {
    correctness: number; // 0-10
    clarity: number; // 0-10
    depth: number; // 0-10
    totalScore: number;
    reasoning: string;
}

interface FinalEvaluation {
    overallScore: number; // 0-10
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}


class PromptEvalService {
    private readonly langchainConnector: LangchainConnector;
    private readonly promptExtracterService: PromptExtracterService;
    private readonly serviceFactory: ServiceFactory;
    private readonly promptService: PromptService;
    private readonly expensiveModel: ChatOpenAI;
    private readonly evaluatorModel: ChatAnthropic;
    private readonly antropicConnector: AntropicConnector;

    constructor() {
        this.langchainConnector = new LangchainConnector();
        this.promptExtracterService = new PromptExtracterService();
        this.serviceFactory = new ServiceFactory();
        this.promptService = this.serviceFactory.getPromptService();
        
        // Expensive model for golden prompt generation
        this.expensiveModel = new ChatOpenAI({
            model: "gpt-4o",
            temperature: 0.1,
            maxTokens: 2000
        });
        
        // Model for LLM-as-judge evaluation
        this.antropicConnector = new AntropicConnector();
        this.evaluatorModel = this.antropicConnector.getLLM();
    }

    // Generate golden prompt using expensive model
    private async generateGoldenPrompt(state: EvaluationState): Promise<EvaluationState> {
        const chatData = JSON.stringify({
            success: true,
            data: { chat_history: state.chatHistory }
        });

        const messages = [
            { role: 'system', content: state.systemPrompt },
            { role: 'user', content: `Here is the chat history to analyze:\n${chatData}\n\nPlease extract and generate the prompt template:` }
        ];

        const goldenPrompt = await this.expensiveModel.invoke(messages);
        
        return {
            ...state,
            goldenPrompt: typeof goldenPrompt === 'string' ? goldenPrompt : (goldenPrompt as any)?.content || String(goldenPrompt)
        };
    }

    // Heuristic evaluation
    private async evaluateHeuristics(state: EvaluationState): Promise<EvaluationState> {
        const { generatedPrompt, goldenPrompt } = state;
        const details: string[] = [];

        // Length scoring (0-10)
        const generatedLength = generatedPrompt.length;
        const goldenLength = goldenPrompt?.length || 0;
        const lengthRatio = Math.min(generatedLength / goldenLength, goldenLength / generatedLength);
        const lengthScore = Math.round(lengthRatio * 10);
        details.push(`Length comparison: Generated(${generatedLength}) vs Golden(${goldenLength}) - Score: ${lengthScore}/10`);

        // Variable count scoring (0-10)
        const generatedVars = (generatedPrompt.match(/\{[^}]+\}/g) || []).length;
        const goldenVars = (goldenPrompt?.match(/\{[^}]+\}/g) || []).length;
        const varRatio = goldenVars > 0 ? Math.min(generatedVars / goldenVars, goldenVars / generatedVars) : (generatedVars === 0 ? 1 : 0);
        const variableScore = Math.round(varRatio * 10);
        details.push(`Variable count: Generated(${generatedVars}) vs Golden(${goldenVars}) - Score: ${variableScore}/10`);

        // Format scoring based on structure patterns (0-10)
        const hasInstructions = /\b(act|be|you are|your task|please|instructions?)\b/i.test(generatedPrompt);
        const hasVariables = generatedVars > 0;
        const hasStructure = /[-•*]\s/.test(generatedPrompt) || /\d+\.\s/.test(generatedPrompt);
        const formatScore = (hasInstructions ? 4 : 0) + (hasVariables ? 3 : 0) + (hasStructure ? 3 : 0);
        details.push(`Format elements: Instructions(${hasInstructions}) Variables(${hasVariables}) Structure(${hasStructure}) - Score: ${formatScore}/10`);

        // Structure scoring based on prompt engineering best practices (0-10)
        const hasRole = /\b(act like|you are|as a|role of)\b/i.test(generatedPrompt);
        const hasContext = /\b(context|background|given|provided|here is)\b/i.test(generatedPrompt);
        const hasOutput = /\b(output|format|response|generate|create)\b/i.test(generatedPrompt);
        const structureScore = (hasRole ? 3 : 0) + (hasContext ? 3 : 0) + (hasOutput ? 4 : 0);
        details.push(`Structure elements: Role(${hasRole}) Context(${hasContext}) Output(${hasOutput}) - Score: ${structureScore}/10`);

        const totalScore = Math.round((lengthScore + formatScore + variableScore + structureScore) / 4);

        const heuristicScore: HeuristicScore = {
            lengthScore,
            formatScore,
            variableScore,
            structureScore,
            totalScore,
            details
        };

        return { ...state, heuristicScore };
    }

    // LLM-as-a-judge evaluation
    private async evaluateWithLLM(state: EvaluationState): Promise<EvaluationState> {
        const { generatedPrompt, goldenPrompt } = state;

        const evaluationPrompt = `You are an expert prompt engineer evaluating the quality of AI prompts.

GOLDEN PROMPT (Reference):
${goldenPrompt}

GENERATED PROMPT (To Evaluate):
${generatedPrompt}

Please rate the GENERATED PROMPT compared to the GOLDEN PROMPT on the following criteria (0-10 scale):

1. CORRECTNESS: How well does it capture the core intent and requirements?
2. CLARITY: How clear and unambiguous are the instructions?
3. DEPTH: How comprehensive and detailed is the prompt?

Respond in JSON format:
{
  "correctness": <score>,
  "clarity": <score>, 
  "depth": <score>,
  "reasoning": "<detailed explanation of scores>"
}`;

        const response = await this.evaluatorModel.invoke(evaluationPrompt);
        const responseText = typeof response === 'string' ? response : (response as any)?.content || String(response);
        
        try {
            // Clean the response text - remove markdown code blocks and extra whitespace
            let cleanedResponse = responseText.trim();
            
            // Remove markdown code blocks if present
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            // Remove any leading/trailing whitespace
            cleanedResponse = cleanedResponse.trim();
            
            console.log('Cleaned LLM response for parsing:', cleanedResponse);
            
            const evaluation = JSON.parse(cleanedResponse);
            const totalScore = Math.round((evaluation.correctness + evaluation.clarity + evaluation.depth) / 3);

            const llmScore: LLMScore = {
                correctness: evaluation.correctness,
                clarity: evaluation.clarity,
                depth: evaluation.depth,
                totalScore,
                reasoning: evaluation.reasoning
            };

            return { ...state, llmScore };
        } catch (error) {
            console.error('Failed to parse LLM evaluation:', error);
            // Fallback scoring
            const llmScore: LLMScore = {
                correctness: 5,
                clarity: 5,
                depth: 5,
                totalScore: 5,
                reasoning: "Failed to parse evaluation response"
            };
            return { ...state, llmScore };
        }
    }

    // Generate final evaluation
    private async generateFinalEvaluation(state: EvaluationState): Promise<EvaluationState> {
        const { heuristicScore, llmScore } = state;
        
        if (!heuristicScore || !llmScore) {
            throw new Error("Missing evaluation scores");
        }

        // Weighted average: 40% heuristic, 60% LLM
        const overallScore = Math.round((heuristicScore.totalScore * 0.4) + (llmScore.totalScore * 0.6));

        const strengths: string[] = [];
        const weaknesses: string[] = [];
        const recommendations: string[] = [];

        // Analyze strengths
        if (heuristicScore.variableScore >= 8) strengths.push("Good use of variables for templating");
        if (heuristicScore.formatScore >= 8) strengths.push("Well-structured format");
        if (llmScore.clarity >= 8) strengths.push("Clear and unambiguous instructions");
        if (llmScore.depth >= 8) strengths.push("Comprehensive and detailed");

        // Analyze weaknesses
        if (heuristicScore.variableScore <= 5) weaknesses.push("Poor variable usage");
        if (heuristicScore.structureScore <= 5) weaknesses.push("Lacks proper prompt structure");
        if (llmScore.correctness <= 5) weaknesses.push("Doesn't capture core requirements well");
        if (llmScore.clarity <= 5) weaknesses.push("Instructions are unclear or ambiguous");

        // Generate recommendations
        if (heuristicScore.variableScore <= 6) recommendations.push("Add more parameterized variables for reusability");
        if (heuristicScore.structureScore <= 6) recommendations.push("Include role, context, and output format specifications");
        if (llmScore.depth <= 6) recommendations.push("Provide more specific and detailed instructions");
        if (overallScore <= 6) recommendations.push("Consider studying prompt engineering best practices");

        const finalEvaluation: FinalEvaluation = {
            overallScore,
            strengths,
            weaknesses,
            recommendations
        };

        return { ...state, finalEvaluation };
    }

    // Main evaluation workflow using LangGraph
    async evaluatePrompt(chatId: string = "ec0c385b-13c0-4e40-85d2-b45bae2eb98c") {
        try {
            // Get chat history and system prompt
            const messages = await this.promptExtracterService.getMessage(chatId);
            const chatService = this.serviceFactory.getChatService();
            const chat = await chatService.getChatById(chatId);
            
            if (!chat) {
                throw new Error('Chat not found');
            }

            // Get latest generated prompt
            const allPrompts = await this.promptService.getAllPrompts();
            const sortedPrompts = allPrompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const latestPrompt = sortedPrompts[0];

            if (!latestPrompt) {
                throw new Error("No prompt found");
            }

            // Initial state
            const initialState: EvaluationState = {
                chatHistory: chat.chat_history,
                systemPrompt: this.promptExtracterService.getSystemPrompt(),
                generatedPrompt: latestPrompt.prompt_content
            };

            // Execute evaluation pipeline sequentially (simplified approach)
            console.log("🔍 Step 1: Generating golden prompt with expensive model...");
            const stateWithGolden = await this.generateGoldenPrompt(initialState);
            
            console.log("📊 Step 2: Running heuristic evaluation...");
            const stateWithHeuristic = await this.evaluateHeuristics(stateWithGolden);
            
            console.log("🤖 Step 3: Running LLM-as-judge evaluation...");
            const stateWithLLM = await this.evaluateWithLLM(stateWithHeuristic);
            
            console.log("📋 Step 4: Generating final evaluation...");
            const result = await this.generateFinalEvaluation(stateWithLLM);

            console.log("Evaluation Results:", JSON.stringify(result.finalEvaluation, null, 2));
            
            return result;

        } catch (error) {
            console.error('Error in prompt evaluation:', error);
            throw error;
        }
    }
}

export default PromptEvalService;