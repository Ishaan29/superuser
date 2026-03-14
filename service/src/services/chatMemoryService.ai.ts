import { ServiceContainer } from "@/config/serviceContainer";
import { ChatService } from "./ChatService";
import LLMRouterService from "./llmRouterService";


interface ChatSummary {
    summary: string;
}


class ChatSummaryService {
    private readonly _serviceContainer: ServiceContainer;
    private _chatService?: ChatService;
    private _llmRouter?: LLMRouterService;

    constructor() {
        this._serviceContainer = ServiceContainer.getInstance();
    }

    private get chatService(): ChatService {
        if (!this._chatService) {
            this._chatService = this._serviceContainer.getChatService();
        }
        return this._chatService;
    }

    private get llmRouter(): LLMRouterService {
        if (!this._llmRouter) {
            this._llmRouter = this._serviceContainer.getLLMRouterService();
        }
        return this._llmRouter;
    }

    private getSummarySystemPrompt(): string {
        return `
        You are a helpful assistant that summarises the chat history.
        You will be given a chat history and you will need to summarise it.
        You will need to summarise the chat history in a way that is easy to understand and use.
        You will need to extract the key facts from the chat history.
        You will need to extract key memories from the chat history.
        You will need to extract the user's metadata from the chat history.

        The summary should capture the users intent, facts, memories, and any other relevant information pricesly.
        Your response should be in the following format.
        {
            "summary": "The summary of the chat history",
            "facts": ["Fact 1", "Fact 2", "Fact 3"],
            "memories": ["Memory 1", "Memory 2", "Memory 3"],
            "intent": "The intent of the user",
            "user_metadata": {
            },
            "user_soft_interests": ["Interest 1", "Interest 2", "Interest 3"],
            "user_hidden_interests": ["Interest 1", "Interest 2", "Interest 3"],
            "other_relevant_information": "Any other relevant information"
        }
        `;
    }

    async getChatSummary(chatId: string): Promise<ChatSummary> {
        const chat = await this.chatService.getChatById(chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }

        const chatHistory = chat.chat_history;
        const chatHistoryString = chatHistory.map((message: any) => `${message.role}: ${message.content}`).join("\n");
        const systemPrompt = this.getSummarySystemPrompt();
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: chatHistoryString }
        ];

        const response = await this.llmRouter.chatWithHistory(messages , "claude-3-5-sonnet-20240620");

        const summary = response;

        console.log("Summary: ", summary);

        return {
            summary: summary
        }
    }

    
}

export default ChatSummaryService;