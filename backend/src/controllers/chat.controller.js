import { z } from "zod";
import { ChatSession } from "../models/ChatSession.js";
import { SkinScan } from "../models/SkinScan.js";
import { retrieveKnowledge } from "../services/ragService.js";
import { generateAssistantResponse } from "../services/llmService.js";
import { filterAssistantText } from "../services/safetyService.js";

const schema = z.object({ scanId: z.string().optional(), message: z.string().min(1), chatId: z.string().optional() });

export async function chat(req, res, next) {
  try {
    const input = schema.parse(req.body);
    const scan = input.scanId ? await SkinScan.findOne({ _id: input.scanId, user: req.user.sub }).populate("symptomProfile").lean() : null;
    const sources = await retrieveKnowledge(input.message);
    const raw = await generateAssistantResponse({
      modelResult: scan?.modelResult,
      symptoms: scan?.symptomProfile,
      risk: scan?.risk,
      sources,
      question: input.message
    });
    const safe = filterAssistantText(raw);
    const session = input.chatId
      ? await ChatSession.findOneAndUpdate(
          { _id: input.chatId, user: req.user.sub },
          { $push: { messages: [{ role: "user", content: input.message }, { role: "assistant", content: safe.text, safety: safe, sources }] } },
          { new: true }
        )
      : await ChatSession.create({ user: req.user.sub, scan: input.scanId, messages: [{ role: "user", content: input.message }, { role: "assistant", content: safe.text, safety: safe, sources }] });
    res.json({ chatId: session._id, response: safe.text, safety: safe, sources });
  } catch (error) {
    next(error);
  }
}
