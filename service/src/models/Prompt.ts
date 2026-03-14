import { Schema, model, Document } from "mongoose";

export interface Prompt extends Document {
    prompt_id?: string,
    user_id: string,
    prompt_name: string,
    prompt_description: string,
    prompt_content: string,
    model_name: string, 
    created_at: Date,
    updated_at: Date,
}

const PromptSchema: Schema = new Schema({
    prompt_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    user_id: {
        type: String,
        required: true,
        trim: true,
    },
    prompt_name: {
        type: String,
        required: true,
        trim: true,
    },
    prompt_description: {
        type: String,
        required: true,
        trim: true,
    },
    prompt_content: {
        type: String,
        required: true,
        trim: true,
    },
    model_name: {
        type: String,
        required: true,
        trim: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Update the updated_at field on save
PromptSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

PromptSchema.index({ user_id: 1 });
PromptSchema.index({ prompt_id: 1 });

export const PromptModel = model<Prompt>('Prompt', PromptSchema);