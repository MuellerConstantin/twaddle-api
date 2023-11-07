import mongoose from 'mongoose';
import connection from '../config/mongoose';
import {MessageSchema} from './message';

export const PrivateChatSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
      validate: [(value) => value.length === 2, 'Private chats must have exactly two participants.'],
    },
    messages: [MessageSchema],
  },
  {collection: 'private-chats', timestamps: true},
);

const PrivateChatModel = connection.model('PrivateChat', PrivateChatSchema);

export default PrivateChatModel;
