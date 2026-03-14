import LangchainConnector from "./langchainConnector";
import { ChatAnthropic } from "@langchain/anthropic";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import UsageHandler from "../middleware/usageHandler";
import { LLMProvider } from "./llmProvider.interface";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

import dotenv from "dotenv";

dotenv.config();

class AntropicConnector extends LangchainConnector implements LLMProvider {
    private readonly anthropicApiKey: string = process.env.ANTHROPIC_API_KEY || "";

    constructor() {
        super();
        if (!this.anthropicApiKey) {
            throw new Error("ANTHROPIC_API_KEY is not set");
        }        
    }

    getLLM() {
        const llm = new ChatAnthropic({
            apiKey: this.anthropicApiKey,
            model: "claude-3-5-sonnet-20240620",
            temperature: 0.7,
            topP: 1,
            maxTokens: 1000,
            callbacks: [new ConsoleCallbackHandler(), new UsageHandler()],
        })
        return llm;
    }
    async getModels(): Promise<string[]> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/models', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.anthropicApiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = await response.json() as { data?: any[] };
            return data.data?.map((model: any) => model.id) || [];
        } catch (error) {
            console.error('Error fetching Anthropic models:', error);
            throw new Error('Failed to fetch available models');
        }
    }

    getLLMByName(name: string) {
        return new ChatAnthropic({
            apiKey: this.anthropicApiKey,
            model: name,
            temperature: 0.7,
            topP: 1,
            maxTokens: 1000,
        })
    }

    async chatWithHistory(messages: any[], modelName?: string): Promise<string> {
        try {
            const llm = new ChatAnthropic({
                apiKey: this.anthropicApiKey,
                model: modelName || "claude-3-5-sonnet-20240620",
                temperature: 0.7,
                topP: 1,
                maxTokens: 1000,
            });

            // Convert messages to LangChain format
            const langchainMessages = messages.map(msg => {
                if (msg.role === 'user') {
                    return new HumanMessage(msg.content);
                } else if (msg.role === 'assistant') {
                    return new AIMessage(msg.content);
                } else if (msg.role === 'system') {
                    return new SystemMessage(msg.content);
                }
                return new HumanMessage(msg.content);
            });

            const response = await llm.invoke(langchainMessages);
            return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        } catch (error) {
            console.error('Error in Anthropic chatWithHistory:', error);
            throw new Error('Failed to get response from Anthropic');
        }
    }

}


export default AntropicConnector;