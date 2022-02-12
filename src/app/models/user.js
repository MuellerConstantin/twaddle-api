import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connection from "../config/mongoose";

const UserSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ["ADMINISTRATOR", "MODERATOR", "MEMBER"],
    default: "MEMBER",
  },
});

// eslint-disable-next-line func-names
UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(this.password, salt);

  this.password = hash;
  return next();
});

// eslint-disable-next-line func-names
UserSchema.methods.isValidPassword = function (plain) {
  return bcrypt.compareSync(plain, this.password);
};

// eslint-disable-next-line func-names
UserSchema.methods.toDTO = function (view) {
  switch (view) {
    case "profile": {
      return {
        // eslint-disable-next-line no-underscore-dangle
        id: this._id,
        username: this.username,
      };
    }
    default: {
      return {
        // eslint-disable-next-line no-underscore-dangle
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
      };
    }
  }
};

const UserModel = connection.model("User", UserSchema);

export default UserModel;
