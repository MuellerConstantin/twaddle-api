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
  blocked: {
    type: Boolean,
    default: false,
  },
  firstName: String,
  lastName: String,
  sex: {
    type: String,
    enum: ["MALE", "FEMALE", "DIVERS"],
  },
  biography: String,
  image: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Attachment",
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
UserSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.$set?.password) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(update.$set.password, salt);

    update.$set.password = hash;
  }

  next();
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
        firstName: this.firstName || undefined,
        lastName: this.lastName || undefined,
        sex: this.sex || undefined,
        biography: this.biography || undefined,
        image: this.populated("image")
          ? // eslint-disable-next-line no-underscore-dangle
            this.image._id
          : this.image || undefined,
      };
    }
    default: {
      return {
        // eslint-disable-next-line no-underscore-dangle
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
        blocked: this.blocked,
        firstName: this.firstName || undefined,
        lastName: this.lastName || undefined,
        sex: this.sex || undefined,
        biography: this.biography || undefined,
        image: this.populated("image")
          ? // eslint-disable-next-line no-underscore-dangle
            this.image._id
          : this.image || undefined,
      };
    }
  }
};

const UserModel = connection.model("User", UserSchema);

export default UserModel;
