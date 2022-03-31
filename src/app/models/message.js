import mongoose from "mongoose";
import connection from "../config/mongoose";

const MessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["TEXT", "IMAGE", "VIDEO", "AUDIO"],
      default: "TEXT",
    },
    content: String,
    attachment: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Attachment",
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    room: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Room",
    },
  },
  { timestamps: true }
);

// eslint-disable-next-line func-names
MessageSchema.methods.toDTO = function (view) {
  switch (view) {
    default: {
      return {
        // eslint-disable-next-line no-underscore-dangle
        id: this._id,
        content: this.content || undefined,
        attachment: this.populated("attachment")
          ? // eslint-disable-next-line no-underscore-dangle
            this.attachment._id
          : this.attachment || undefined,
        type: this.type,
        user: this.populated("user") ? this.user.username : this.user,
        // eslint-disable-next-line no-underscore-dangle
        room: this.populated("room") ? this.room._id : this.room,
        timestamp: this.createdAt,
      };
    }
  }
};

const MessageModel = connection.model("Message", MessageSchema);

export default MessageModel;
