import mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema(
  {
    from: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    content: {type: String, required: true},
  },
  {timestamps: true},
);
