import { OpenAIConnector } from "../connectors/openAIConnector";
import AntropicConnector from "../connectors/antropicConnector.langchain";
import { LLMProvider } from "../connectors/llmProvider.interface";

export class LLMRouterService {
    private readonly openAIConnector: OpenAIConnector;
    private readonly anthropicConnector: AntropicConnector;
    private modelProviderMap: Map<string, string> = new Map();

    constructor() {
        this.openAIConnector = new OpenAIConnector();
        this.anthropicConnector = new AntropicConnector();
        this.initializeModelProviderMap();
    }

    private initializeModelProviderMap(): void {
        // OpenAI models
        const openAIModels = [
            'gpt-4o', 'gpt-4o-mini', 'gpt-4o-mini-2024-07-18', 'gpt-4-turbo', 
            'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'text-davinci-003'
        ];

        // Anthropic models
        const anthropicModels = [
            'claude-3-5-sonnet-20240620', 'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022', 'claude-3-sonnet-20240229',
            'claude-3-opus-20240229', 'claude-3-haiku-20240307'
        ];

        // Map OpenAI models
        openAIModels.forEach(model => {
            this.modelProviderMap.set(model, 'openai');
        });

        // Map Anthropic models
        anthropicModels.forEach(model => {
            this.modelProviderMap.set(model, 'anthropic');
        });
    }

    private getProviderForModel(modelName: string): string {
        // Check exact match first
        if (this.modelProviderMap.has(modelName)) {
            return this.modelProviderMap.get(modelName)!;
        }

        // Check for partial matches
        if (modelName.toLowerCase().includes('gpt') || 
            modelName.toLowerCase().includes('davinci') ||
            modelName.toLowerCase().includes('turbo')) {
            return 'openai';
        }

        if (modelName.toLowerCase().includes('claude')) {
            return 'anthropic';
        }

        // Default to OpenAI
        return 'openai';
    }

    private getConnectorForProvider(provider: string): LLMProvider {
        switch (provider) {
            case 'openai':
                return this.openAIConnector;
            case 'anthropic':
                return this.anthropicConnector;
            default:
                return this.openAIConnector;
        }
    }

    async getAllModels(): Promise<string[]> {
        try {
            const [openAIModels, anthropicModels] = await Promise.all([
                this.openAIConnector.getModels(),
                this.anthropicConnector.getModels()
            ]);

            return [...openAIModels, ...anthropicModels];
        } catch (error) {
            console.error('Error fetching all models:', error);
            // Return known models as fallback
            return Array.from(this.modelProviderMap.keys());
        }
    }

    async getModelsByProvider(provider: 'openai' | 'anthropic'): Promise<string[]> {
        try {
            const connector = this.getConnectorForProvider(provider);
            return await connector.getModels();
        } catch (error) {
            console.error(`Error fetching ${provider} models:`, error);
            return [];
        }
    }

    async chatWithHistory(messages: any[], modelName: string): Promise<string> {
        try {
            const provider = this.getProviderForModel(modelName);
            const connector = this.getConnectorForProvider(provider);
            
            console.log(`Routing to ${provider} for model: ${modelName}`);
            
            return await connector.chatWithHistory(messages, modelName);
        } catch (error) {
            console.error(`Error in LLM routing for model ${modelName}:`, error);
            throw new Error(`Failed to get response from ${modelName}`);
        }
    }

    getLLMByName(modelName: string): any {
        const provider = this.getProviderForModel(modelName);
        const connector = this.getConnectorForProvider(provider);
        return connector.getLLMByName(modelName);
    }

    getProviderInfo(modelName: string): { provider: string; model: string } {
        const provider = this.getProviderForModel(modelName);
        return {
            provider,
            model: modelName
        };
    }
}

export default LLMRouterService; 