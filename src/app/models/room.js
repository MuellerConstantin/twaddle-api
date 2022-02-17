import mongoose from "mongoose";
import connection from "../config/mongoose";

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    description: String,
  },
  { timestamps: true }
);

// eslint-disable-next-line func-names
RoomSchema.methods.toDTO = function (view) {
  switch (view) {
    default: {
      return {
        // eslint-disable-next-line no-underscore-dangle
        id: this._id,
        name: this.name,
        description: this.description,
        createdAt: this.createdAt,
      };
    }
  }
};

const RoomModel = connection.model("Room", RoomSchema);

export default RoomModel;
