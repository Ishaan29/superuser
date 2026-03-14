import { OpenAIConnector } from "../connectors/openAIConnector";
import { ChatService } from "./ChatService";
import { Service } from '../factory/IServiceFactory';
import LangchainConnector from "../connectors/langchainConnector";

export class PromptExtracterService implements Service {
    private readonly openAIConnector: OpenAIConnector;
    private readonly chatService: ChatService;
    private readonly langchainConnector: LangchainConnector;

    constructor() {
        this.openAIConnector = new OpenAIConnector();
        this.chatService = new ChatService();
        this.langchainConnector = new LangchainConnector();
    }

    getSystemPrompt(): string {
        return `You are a Prompt  Engineer with an expertise in creating prompts for AI agents.
        You will be given a chat history and you will need to extract the prompt from the chat history.
        This chat history is a conversation between a user and an LLM model, that the user found successful.
        The user is trying to create a prompt that will be used to generate a similar response from the LLM model.
        The prompt that you generate should be a template that can be used to generate similer high quality responses from any LLM models.

        You will be given a JSON object like this:
        {
            "success": true,
            "data": {
                "chat_history": [
                { "role": "user", "content": "…" },
                { "role": "assistant", "content": "…" },
                …,
                { "role": "user", "content": "FINAL_USER_MESSAGE" }
                ]
            }
        }
        Your tasks:
        1. Parse the JSON and understand the conversation between the user and the LLM model.
        2. Extract the user message and how the LLM model responded to it.
        3. Identify the pattern for which the user got the desired response.
        4. Abstract the pattern such that it can be used in different similer context scenarios.
        5. If there is a mention of a document that is to be refered, use @DOCUMENT_NAME to refer to it.
        6. Based on the abstracted pattern, break its content into a parameterized template using placeholders:
        - {Role}, {Format}, {TOPIC}, {DETAILS}, etc.
        7. Output only the prompt template, e.g.:
        Act like a {ROLE}: {ACTION} {TOPIC} in a {FORMAT} and include {DETAILS}.`;
    }
    async getMessage(chatId: string) {
        const chat = await this.chatService.getChatById(chatId);
        const systemPrompt = this.getSystemPrompt();
        if (!chat) {
            throw new Error('Chat not found');
        }
        const chatData = JSON.stringify({
            success: true,
            data: {
                chat_history: chat.chat_history
            }
        });
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is the chat history to analyze:\n${chatData}\n\n` }
        ];
        
        return messages;
    }

    async extractPromptWithLangchain(chatId: string) {
        const chat = await this.chatService.getChatById(chatId);
        
        if (!chat) {
            throw new Error('Chat not found');
        }
        
        const systemPrompt = this.getSystemPrompt();
        const chatData = JSON.stringify({
            success: true,
            data: {
                chat_history: chat.chat_history
            }
        });
        
        try {
            const llm = this.langchainConnector.getInternalLLM();
            
            // Create messages array with system and user roles (like OpenAI connector)
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Here is the chat history to analyze:\n${chatData}\n\n` }
            ];
            
            // Invoke the LLM with the messages array
            const response = await llm.invoke(messages);
            
            // Extract the content from the response (LangChain returns an object)
            const extractedPrompt = typeof response === 'string' 
                ? response 
                : (response as any)?.content || (response as any)?.text || String(response);
            
            console.log('LangChain extracted prompt:', extractedPrompt);
            
            return extractedPrompt;
            
        } catch (error) {
            console.error('Error extracting prompt with LangChain:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to extract prompt using LangChain: ${errorMessage}`);
        }
    }

    async extractPrompt(chatId: string) {
        const chat = await this.chatService.getChatById(chatId);
        
        if (!chat) {
            throw new Error('Chat not found');
        }
        
        const systemPrompt = this.getSystemPrompt();
        const chatData = JSON.stringify({
            success: true,
            data: {
                chat_history: chat.chat_history
            }
        });
        
        const prompt = await this.openAIConnector.newChatWithSystemPrompt(chatData, systemPrompt);
        console.log(prompt);
        return prompt;
    }
}