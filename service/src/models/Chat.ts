import mongoose, { Document, Schema } from 'mongoose';

// Message interface for chat history
export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Chat interface
export interface IChat extends Document {
  user_id: string;
  chat_id: string;
  model_name: string;
  chat_history: IMessage[];
  created_at: Date;
  updated_at: Date;
}

// Message schema
const MessageSchema: Schema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system'],
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // Don't create _id for subdocuments
);

// Chat schema
const ChatSchema: Schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      trim: true,
    },
    chat_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    model_name: {
      type: String,
      required: true,
      trim: true,
    },
    chat_history: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Create indexes for better performance
ChatSchema.index({ user_id: 1 });
ChatSchema.index({ chat_id: 1 });
ChatSchema.index({ user_id: 1, created_at: -1 }); // For getting user's recent chats

// Export the model
export const Chat = mongoose.model<IChat>('Chat', ChatSchema); 