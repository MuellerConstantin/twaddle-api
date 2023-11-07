import mongoose from 'mongoose';
import connection from '../config/mongoose';
import {MessageSchema} from './message';

export const GroupChatSchema = new mongoose.Schema(
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
    formerParticipants: {
      type: [
        {
          user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
          leftAt: {type: Date, required: true},
          reason: {type: String, required: true, enum: ['left', 'removed']},
        },
      ],
      required: true,
    },
    avatar: {
      type: String,
    },
    messages: [MessageSchema],
  },
  {collection: 'group-chats', timestamps: true},
);

const GroupChatModel = connection.model('GroupChat', GroupChatSchema);

export default GroupChatModel;
