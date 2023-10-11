import mongoose from 'mongoose';
import connection from '../config/mongoose';

const MessageSchema = new mongoose.Schema(
  {
    from: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    content: {type: String, required: true},
  },
  {timestamps: true},
);

const PrivateChatSchema = new mongoose.Schema(
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

const GroupChatSchema = new mongoose.Schema(
  {
    name: {type: String, required: true},
    participants: {
      type: [
        {
          user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
          isAdmin: {type: Boolean, required: true},
        },
      ],
      required: true,
    },
    messages: [MessageSchema],
  },
  {collection: 'group-chats', timestamps: true},
);

export const PrivateChatModel = connection.model('PrivateChat', PrivateChatSchema);
export const GroupChatModel = connection.model('GroupChat', GroupChatSchema);
