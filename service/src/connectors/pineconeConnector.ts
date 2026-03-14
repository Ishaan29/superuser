import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();
class PineconeConnector {
    private readonly pc: Pinecone;
    private readonly PINECONE_API_KEY = process.env.PINECONE_API_KEY;
    private readonly PINECONE_INDEX_NAME = "super-user-chat-history";

    constructor() {
        if (!this.PINECONE_API_KEY) {
            throw new Error("PINECONE_API_KEY is not set");
        }
        this.pc = new Pinecone({
            apiKey: this.PINECONE_API_KEY,
        });
    }

    private async ensureIndexExists() {
        try {
            // Check if index exists
            await this.pc.describeIndex(this.PINECONE_INDEX_NAME);
            console.log(`Index ${this.PINECONE_INDEX_NAME} already exists`);
        } catch (error) {
            console.log(`Creating index ${this.PINECONE_INDEX_NAME}...`);
            await this.pc.createIndex({
                name: this.PINECONE_INDEX_NAME,
                dimension: 1536, // OpenAI text-embedding-ada-002 dimension
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                },
                waitUntilReady: true,
            });
            console.log(`Index ${this.PINECONE_INDEX_NAME} created successfully`);
        }
    }

    async getIndex() {
        await this.ensureIndexExists();
        return this.pc.index(this.PINECONE_INDEX_NAME);
    }

    async upsertChatMessage(messageId: string, chatId: string, userId: string, content: string, embedding: number[], metadata: any = {}) {
        const index = await this.getIndex();
        
        await index.upsert([{
            id: messageId,
            values: embedding,
            metadata: {
                chatId,
                userId,
                content,
                timestamp: new Date().toISOString(),
                ...metadata
            }
        }]);
    }

    async searchSimilarMessages(queryEmbedding: number[], filter: any = {}, topK: number = 10) {
        const index = await this.getIndex();
        
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK,
            filter,
            includeMetadata: true
        });

        return queryResponse.matches || [];
    }

    async deleteChatMessages(chatId: string) {
        const index = await this.getIndex();
        
        await index.deleteMany({
            filter: { chatId }
        });
    }
}

export default PineconeConnector;