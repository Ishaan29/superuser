import { Prompt } from "../../models/Prompt";
import { IRepository } from "../IRepository";
import { Model } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

export class PromptRepository implements IRepository<Prompt> {
    private readonly promptModel: Model<Prompt>;

    constructor(promptModel: Model<Prompt>) {
        this.promptModel = promptModel;
    }

    async create(entity: Prompt): Promise<Prompt> {
        entity.prompt_id = uuidv4();
        entity.created_at = new Date();
        entity.updated_at = new Date();
        return this.promptModel.create(entity);
    }

    async findById(id: string): Promise<Prompt | null> {
        return this.promptModel.findOne({ prompt_id: id }).exec();
    }

    async findAll(): Promise<Prompt[]> {
        return this.promptModel.find().exec();
    }

    async update(id: string, entity: Partial<Prompt>): Promise<Prompt | null> {
        return this.promptModel.findOneAndUpdate(
            { prompt_id: id }, 
            entity, 
            { new: true, runValidators: true }
        ).exec();
    }

    async delete(id: string): Promise<void> {
        await this.promptModel.findOneAndDelete({ prompt_id: id }).exec();
    }

    // Additional methods specific to Prompt
    async findByUserId(userId: string): Promise<Prompt[]> {
        return this.promptModel.find({ user_id: userId }).exec();
    }

    async findByModelName(modelName: string): Promise<Prompt[]> {
        return this.promptModel.find({ model_name: modelName }).exec();
    }

    async searchByName(searchTerm: string): Promise<Prompt[]> {
        return this.promptModel.find({
            prompt_name: { $regex: searchTerm, $options: 'i' }
        }).exec();
    }
}