import mongoose from 'mongoose';
import connection from '../config/mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
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
  },
  {collection: 'users', timestamps: true},
);

const UserModel = connection.model('User', UserSchema);

export default UserModel;
