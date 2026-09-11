import { z } from "zod";
import { SkinScan } from "../models/SkinScan.js";
import { SymptomProfile } from "../models/SymptomProfile.js";
import { CareReport } from "../models/CareReport.js";
import { mlService } from "../services/mlService.js";
import { assessRisk } from "../services/riskService.js";
import { retrieveKnowledge } from "../services/ragService.js";
import { generateAssistantResponse } from "../services/llmService.js";
import { filterAssistantText } from "../services/safetyService.js";
import { buildReport } from "../services/reportService.js";
import { HttpError } from "../utils/httpError.js";

const symptomsSchema = z.object({
  scanId: z.string().optional(),
  symptoms: z.string().min(1),
  duration: z.string().min(1),
  allergies: z.string().optional().default(""),
  history: z.string().optional().default(""),
  bodyArea: z.string().optional().default(""),
  notes: z.string().optional().default("")
});

export async function uploadScan(req, res, next) {
  try {
    if (!req.file) throw new HttpError(400, "Please choose or take a skin image first.");
    const scan = await SkinScan.create({
      user: req.user.sub,
      image: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path
      }
    });
    res.status(201).json({ scanId: scan._id, message: "Image uploaded. Review it before starting analysis." });
  } catch (error) {
    next(error);
  }
}

export async function analyzeScan(req, res, next) {
  try {
    const input = symptomsSchema.parse(req.body);
    const scan = await SkinScan.findOne({ _id: input.scanId, user: req.user.sub });
    if (!scan) throw new HttpError(404, "Scan not found.");
    const symptoms = await SymptomProfile.create({ user: req.user.sub, ...input });
    const quality = await mlService.qualityCheck(scan.image.storagePath);
    if (quality.usable === false) {
      scan.status = "failed";
      scan.quality = quality;
      scan.symptomProfile = symptoms._id;
      await scan.save();
      return res.status(422).json({ message: "Image quality is insufficient for reliable analysis. Please upload a clearer, well-lit image.", quality });
    }
    const contextText = [input.symptoms, input.duration, input.allergies, input.history, input.bodyArea, input.notes].filter(Boolean).join(" ");
    const modelResult = await mlService.predict(scan.image.storagePath, contextText);
    const gradcam = await mlService.gradcam(scan.image.storagePath);
    const risk = assessRisk({ symptoms: input, duration: input.duration, modelResult, quality });
    const sources = await retrieveKnowledge(`${modelResult.top_prediction || ""} ${input.symptoms} ${input.duration}`);
    const rawAssistant = await generateAssistantResponse({ modelResult, symptoms: input, risk, sources });
    const safe = filterAssistantText(rawAssistant);
    Object.assign(scan, {
      symptomProfile: symptoms._id,
      quality,
      modelResult,
      gradcamPath: gradcam.overlay_path,
      gradcamImage: gradcam.overlay_data_url,
      risk,
      ragSources: sources,
      assistantResponse: safe.text,
      status: "completed"
    });
    await scan.save();
    const report = await CareReport.create({ user: req.user.sub, scan: scan._id, content: buildReport({ scan, symptoms: input, modelResult, quality, risk, assistantResponse: safe.text }) });
    res.json({ scan, reportId: report._id, safety: safe });
  } catch (error) {
    next(error);
  }
}

export async function listScans(req, res, next) {
  try {
    const scans = await SkinScan.find({ user: req.user.sub }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(scans);
  } catch (error) {
    next(error);
  }
}

export async function getScan(req, res, next) {
  try {
    const scan = await SkinScan.findOne({ _id: req.params.id, user: req.user.sub }).populate("symptomProfile").lean();
    if (!scan) throw new HttpError(404, "Scan not found.");
    res.json(scan);
  } catch (error) {
    next(error);
  }
}
