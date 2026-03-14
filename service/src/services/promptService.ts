import { Prompt } from "@/models/Prompt";
import { PromptRepository } from "@/repository/impl/promptRepository";
import { Service } from "../factory/IServiceFactory";

class PromptService implements Service {
    private readonly promptRepository: PromptRepository;

    constructor(promptRepository: PromptRepository) {
        this.promptRepository = promptRepository;
    }

    async createPrompt(prompt: Prompt): Promise<Prompt> {
        return this.promptRepository.create(prompt);
    }

    async getPrompt(promptId: string): Promise<Prompt> {
        const prompt = await this.promptRepository.findById(promptId);
        if (!prompt) {
            throw new Error("Prompt not found");
        }
        return prompt;
    }

    async updatePrompt(promptId: string, prompt: Prompt): Promise<Prompt> {
        const updatedPrompt = await this.promptRepository.update(promptId, prompt);
        if (!updatedPrompt) {
            throw new Error("Prompt not found");
        }
        return prompt;
    }

    async deletePrompt(promptId: string): Promise<void> {
        return this.promptRepository.delete(promptId);
    }

    async getAllPrompts(): Promise<Prompt[]> {
        return this.promptRepository.findAll();
    }
}

export default PromptService;