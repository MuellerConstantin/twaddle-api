import mongoose from 'mongoose';
import connection from '../config/mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    displayName: {
      type: String,
    },
    location: {
      type: String,
    },
    status: {
      type: String,
    }
  },
  {collection: 'users', timestamps: true},
);

const UserModel = connection.model('User', UserSchema);

export default UserModel;
