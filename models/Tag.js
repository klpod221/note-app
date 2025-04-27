import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#3498db", // Default blue color
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique tags per user
tagSchema.index({ name: 1, owner: 1 }, { unique: true });

const Tag = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
export default Tag;