
export interface LLMProvider {
    getLLMByName(name: string): any;
    getModels(): Promise<string[]>;
    chatWithHistory(messages: any[], modelName?: string): Promise<string>;
}