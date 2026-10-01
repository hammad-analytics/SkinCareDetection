import { z } from "zod";
import mongoose from "mongoose";
import { ChatSession } from "../models/ChatSession.js";
import { SkinScan } from "../models/SkinScan.js";
import { retrieveKnowledge } from "../services/ragService.js";
import { generateAssistantResponse } from "../services/llmService.js";
import { filterAssistantText } from "../services/safetyService.js";

const schema = z.object({
  scanId: z.string().nullable().optional(),
  message: z.string().min(1),
  chatId: z.string().nullable().optional()
});

export async function chat(req, res, next) {
  try {
    const input = schema.parse(req.body);
    const isValidScanId = input.scanId && mongoose.Types.ObjectId.isValid(input.scanId);
    const scan = isValidScanId ? await SkinScan.findOne({ _id: input.scanId, user: req.user.sub }).populate("symptomProfile").lean() : null;
    const sources = await retrieveKnowledge(input.message);
    const isValidChatId = input.chatId && mongoose.Types.ObjectId.isValid(input.chatId);
    const existingSession = isValidChatId ? await ChatSession.findOne({ _id: input.chatId, user: req.user.sub }).lean() : null;
    const history = existingSession?.messages || [];

    const raw = await generateAssistantResponse({
      modelResult: scan?.modelResult,
      symptoms: scan?.symptomProfile,
      risk: scan?.risk,
      sources,
      question: input.message,
      history
    });
    const safe = filterAssistantText(raw);
    const session = isValidChatId
      ? await ChatSession.findOneAndUpdate(
          { _id: input.chatId, user: req.user.sub },
          { $push: { messages: [{ role: "user", content: input.message }, { role: "assistant", content: safe.text, safety: safe, sources }] } },
          { new: true }
        )
      : await ChatSession.create({
          user: req.user.sub,
          scan: isValidScanId ? input.scanId : undefined,
          messages: [{ role: "user", content: input.message }, { role: "assistant", content: safe.text, safety: safe, sources }]
        });
    res.json({ chatId: session._id, response: safe.text, safety: safe, sources });
  } catch (error) {
    next(error);
  }
}
