import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class EmbeddingService {
    private readonly openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error('Failed to generate embedding');
        }
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: texts,
            });

            return response.data.map((item: any) => item.embedding);
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw new Error('Failed to generate embeddings');
        }
    }
} 