import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
  },
  {collection: 'users', timestamps: true},
);

UserSchema.pre('save', function (next) {
  // eslint-disable-next-line no-invalid-this
  if (!this.isModified('password')) {
    return next();
  }

  const salt = bcrypt.genSaltSync(10);
  // eslint-disable-next-line no-invalid-this
  const hash = bcrypt.hashSync(this.password, salt);

  // eslint-disable-next-line no-invalid-this
  this.password = hash;
  return next();
});

UserSchema.methods.isValidPassword = function (plain) {
  // eslint-disable-next-line no-invalid-this
  return bcrypt.compareSync(plain, this.password);
};

const UserModel = connection.model('User', UserSchema);

export default UserModel;
