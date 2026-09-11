import { z } from "zod";
import { KnowledgeBase } from "../models/KnowledgeBase.js";

const schema = z.object({ source: z.string().min(1), title: z.string().min(1), content: z.string().min(20), category: z.string().min(1), metadata: z.object({}).passthrough().optional() });

export async function ingestKnowledge(req, res, next) {
  try {
    const input = schema.parse(req.body);
    const doc = await KnowledgeBase.create(input);
    res.status(201).json({ id: doc._id, message: "Knowledge document added for trusted retrieval." });
  } catch (error) {
    next(error);
  }
}
