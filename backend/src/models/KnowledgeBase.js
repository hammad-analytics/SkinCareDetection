import mongoose from "mongoose";

const knowledgeBaseSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    chunk: { type: Number, default: 0 },
    metadata: Object,
    embeddingRef: String
  },
  { timestamps: true }
);

knowledgeBaseSchema.index({ title: "text", content: "text", category: "text" });
export const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
