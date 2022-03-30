import mongoose from "mongoose";
import connection from "../config/mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// eslint-disable-next-line func-names
AttachmentSchema.methods.toDTO = function (view) {
  switch (view) {
    default: {
      return {
        // eslint-disable-next-line no-underscore-dangle
        id: this._id,
        path: this.path,
        mimeType: this.mimeType,
        size: this.size,
      };
    }
  }
};

const AttachmentModel = connection.model("Attachment", AttachmentSchema);

export default AttachmentModel;
