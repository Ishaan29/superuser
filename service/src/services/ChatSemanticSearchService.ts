import PineconeConnector from '../connectors/pineconeConnector';
import { EmbeddingService } from './embeddingService';
import { ChatService } from './ChatService';
import { ServiceContainer } from '../config/serviceContainer';

export interface SemanticSearchResult {
    messageId: string;
    chatId: string;
    userId: string;
    content: string;
    similarity: number;
    timestamp: string;
    metadata?: any;
}

export interface SearchOptions {
    userId?: string;
    chatId?: string;
    topK?: number;
    minSimilarity?: number;
    dateRange?: {
        from?: Date;
        to?: Date;
    };
}

export class ChatSemanticSearchService {
    private readonly pineconeConnector: PineconeConnector;
    private readonly embeddingService: EmbeddingService;
    private _chatService?: ChatService;

    constructor() {
        this.pineconeConnector = new PineconeConnector();
        this.embeddingService = new EmbeddingService();
    }

    private get chatService(): ChatService {
        if (!this._chatService) {
            const container = ServiceContainer.getInstance();
            this._chatService = container.getChatService();
        }
        return this._chatService;
    }

    /**
     * Index a chat message for semantic search
     */
    async indexChatMessage(messageId: string, chatId: string, userId: string, content: string, metadata: any = {}) {
        try {
            // Generate embedding for the message content
            const embedding = await this.embeddingService.generateEmbedding(content);
            
            // Store in Pinecone
            await this.pineconeConnector.upsertChatMessage(
                messageId, 
                chatId, 
                userId, 
                content, 
                embedding, 
                metadata
            );

            console.log(`Indexed message ${messageId} for semantic search`);
        } catch (error) {
            console.error('Error indexing chat message:', error);
            throw new Error('Failed to index chat message for semantic search');
        }
    }

    /**
     * Index multiple chat messages in batch
     */
    async indexChatMessagesBatch(messages: Array<{
        messageId: string;
        chatId: string;
        userId: string;
        content: string;
        metadata?: any;
    }>) {
        try {
            const contents = messages.map(msg => msg.content);
            const embeddings = await this.embeddingService.generateEmbeddings(contents);

            // Store each message with its embedding
            const indexPromises = messages.map((msg, index) => 
                this.pineconeConnector.upsertChatMessage(
                    msg.messageId,
                    msg.chatId,
                    msg.userId,
                    msg.content,
                    embeddings[index],
                    msg.metadata || {}
                )
            );

            await Promise.all(indexPromises);
            console.log(`Indexed ${messages.length} messages for semantic search`);
        } catch (error) {
            console.error('Error batch indexing chat messages:', error);
            throw new Error('Failed to batch index chat messages');
        }
    }

    /**
     * Search for semantically similar chat messages
     */
    async searchSimilarMessages(query: string, options: SearchOptions = {}): Promise<SemanticSearchResult[]> {
        try {
            const {
                userId,
                chatId,
                topK = 10,
                minSimilarity = 0.7,
                dateRange
            } = options;

            // Generate embedding for the search query
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            // Build filter for Pinecone query
            const filter: any = {};
            if (userId) filter.userId = userId;
            if (chatId) filter.chatId = chatId;
            if (dateRange) {
                if (dateRange.from) filter.timestamp = { $gte: dateRange.from.toISOString() };
                if (dateRange.to) {
                    filter.timestamp = { 
                        ...filter.timestamp, 
                        $lte: dateRange.to.toISOString() 
                    };
                }
            }

            // Search in Pinecone
            const searchResults = await this.pineconeConnector.searchSimilarMessages(
                queryEmbedding,
                filter,
                topK
            );

            // Filter by minimum similarity and format results
            const formattedResults: SemanticSearchResult[] = searchResults
                .filter(result => result.score && result.score >= minSimilarity)
                .map(result => ({
                    messageId: result.id,
                    chatId: String(result.metadata?.chatId || ''),
                    userId: String(result.metadata?.userId || ''),
                    content: String(result.metadata?.content || ''),
                    similarity: result.score || 0,
                    timestamp: String(result.metadata?.timestamp || ''),
                    metadata: result.metadata
                }));

            console.log(`Found ${formattedResults.length} similar messages for query: "${query}"`);
            return formattedResults;

        } catch (error) {
            console.error('Error searching similar messages:', error);
            throw new Error('Failed to search similar messages');
        }
    }

    /**
     * Get conversation context based on semantic similarity
     */
    async getConversationContext(query: string, userId: string, currentChatId?: string, contextSize: number = 5): Promise<SemanticSearchResult[]> {
        try {
            // Search across all user's chats, excluding current chat if specified
            const filter: any = { userId };
            if (currentChatId) {
                filter.chatId = { $ne: currentChatId };
            }

            const results = await this.searchSimilarMessages(query, {
                userId,
                topK: contextSize,
                minSimilarity: 0.6
            });

            console.log(`Retrieved ${results.length} context messages for user ${userId}`);
            return results;

        } catch (error) {
            console.error('Error getting conversation context:', error);
            throw new Error('Failed to get conversation context');
        }
    }

    /**
     * Index an entire chat history
     */
    async indexChatHistory(chatId: string) {
        try {
            const chat = await this.chatService.getChatById(chatId);
            if (!chat) {
                throw new Error('Chat not found');
            }

            const messages = chat.chat_history
                .filter((msg: any) => msg.content && msg.content.trim().length > 0)
                .map((msg: any, index: number) => ({
                    messageId: `${chatId}_${index}`,
                    chatId: chatId,
                    userId: chat.user_id,
                    content: msg.content,
                    metadata: {
                        role: msg.role,
                        messageIndex: index
                    }
                }));

            if (messages.length > 0) {
                await this.indexChatMessagesBatch(messages);
                console.log(`Indexed chat history for chat ${chatId} (${messages.length} messages)`);
            }

        } catch (error) {
            console.error('Error indexing chat history:', error);
            throw new Error('Failed to index chat history');
        }
    }

    /**
     * Delete indexed messages for a chat
     */
    async deleteChatIndex(chatId: string) {
        try {
            await this.pineconeConnector.deleteChatMessages(chatId);
            console.log(`Deleted semantic search index for chat ${chatId}`);
        } catch (error) {
            console.error('Error deleting chat index:', error);
            throw new Error('Failed to delete chat index');
        }
    }

    /**
     * Find similar conversations across all chats
     */
    async findSimilarConversations(query: string, userId?: string, topK: number = 5): Promise<SemanticSearchResult[]> {
        try {
            const options: SearchOptions = {
                topK: topK * 3, // Get more results to group by chat
                minSimilarity: 0.6
            };
            
            if (userId) options.userId = userId;

            const results = await this.searchSimilarMessages(query, options);
            
            // Group by chatId and take the best match from each chat
            const chatGroups = new Map<string, SemanticSearchResult>();
            
            results.forEach(result => {
                const existing = chatGroups.get(result.chatId);
                if (!existing || result.similarity > existing.similarity) {
                    chatGroups.set(result.chatId, result);
                }
            });

            // Return top matches, one per conversation
            return Array.from(chatGroups.values())
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);

        } catch (error) {
            console.error('Error finding similar conversations:', error);
            throw new Error('Failed to find similar conversations');
        }
    }
}
