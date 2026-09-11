import { KnowledgeBase } from "../models/KnowledgeBase.js";

export async function retrieveKnowledge(query) {
  const text = String(query || "").slice(0, 1000);
  const docs = await KnowledgeBase.find({ $text: { $search: text } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(5)
    .lean();
  return docs.map((doc) => ({
    source: doc.source,
    title: doc.title,
    category: doc.category,
    content: doc.content.slice(0, 1200)
  }));
}
