import axios, { AxiosResponse } from 'axios';
import { 
  OpenAIChatCompletionResponse, 
  OpenAIChatCompletionRequest, 
  OpenAIChatMessage,
  ChatResponseContent 
} from '../types/openai';
import { LLMProvider } from './llmProvider.interface';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from "dotenv";

dotenv.config();


export class OpenAIConnector implements LLMProvider {
  private readonly apiKey: string;
  private readonly baseURL: string = 'https://api.openai.com/v1';
  private readonly defaultModel: string = 'gpt-4o-mini-2024-07-18';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }



  /**
   * Send a new chat message to OpenAI
   */
  async newChat(message: string): Promise<ChatResponseContent> {
    try {
      const messages: OpenAIChatMessage[] = [
        {
          role: 'user',
          content: message
        }
      ];

      const requestBody: OpenAIChatCompletionRequest = {
        model: this.defaultModel,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      const response: AxiosResponse<OpenAIChatCompletionResponse> = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Extract the assistant's response content
      const assistantMessage = response.data.choices[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('No response content received from OpenAI');
      }

      console.log('OpenAI Usage:', response.data.usage);
      
      return assistantMessage;

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (error.response?.status === 429) {
          throw new Error('OpenAI API rate limit exceeded');
        } else if (error.response?.status === 500) {
          throw new Error('OpenAI API server error');
        }
      }
      
      throw new Error('Failed to get response from OpenAI');
    }
  }



  /**
   * Send a new chat with system prompt
   */
  async newChatWithSystemPrompt(message: string, systemPrompt: string): Promise<ChatResponseContent> {
    try {
      const messages: OpenAIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      const requestBody: OpenAIChatCompletionRequest = {
        model: 'gpt-4', 
        messages,
        max_tokens: 1000,
        temperature: 0.7
      };

      const response: AxiosResponse<OpenAIChatCompletionResponse> = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const assistantMessage = response.data.choices[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('No response content received from OpenAI');
      }

      return assistantMessage;

    } catch (error) {
      console.error('Error calling OpenAI API with system prompt:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  /**
   * Get available models (optional utility method)
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Error fetching models:', error);
      throw new Error('Failed to fetch available models');
    }
  }

  /**
   * Get LLM instance by model name
   */
  getLLMByName(name: string): any {
    // For OpenAI, we don't need to return a specific LLM instance
    // Just return the model name for use in API calls
    return name;
  }

  /**
   * Chat with history using LangChain and specific model name
   */
  async chatWithHistory(messages: any[], modelName?: string): Promise<string> {
    try {
      const llm = new ChatOpenAI({
        apiKey: this.apiKey,
        model: modelName || this.defaultModel,
        temperature: 0.7,
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
      console.error('Error calling OpenAI API with history via LangChain:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
} 