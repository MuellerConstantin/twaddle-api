import mongoose from 'mongoose';
import connection from '../config/mongoose';

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, {timestamps: true});

const ChatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [MessageSchema]
  },
  {collection: 'chats', timestamps: true},
);

const ChatModel = connection.model('Chat', ChatSchema);

export default ChatModel;
