import mongoose from "mongoose";

const skinScanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    image: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      storagePath: String
    },
    symptomProfile: { type: mongoose.Schema.Types.ObjectId, ref: "SymptomProfile" },
    modelResult: Object,
    quality: Object,
    gradcamPath: String,
    gradcamImage: String,
    risk: Object,
    ragSources: [Object],
    assistantResponse: String,
    status: { type: String, enum: ["uploaded", "completed", "failed"], default: "uploaded" }
  },
  { timestamps: true }
);

export const SkinScan = mongoose.model("SkinScan", skinScanSchema);
