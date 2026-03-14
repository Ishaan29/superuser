import mongoose, { Document, Schema } from 'mongoose';

// User interface
export interface IUser extends Document {
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: Date;
  updated_at: Date;
}

// User schema
const UserSchema: Schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    user_email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Create indexes for better performance
UserSchema.index({ user_id: 1 });
UserSchema.index({ user_email: 1 });

// Export the model
export const User = mongoose.model<IUser>('User', UserSchema); 