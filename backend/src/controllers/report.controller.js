import { CareReport } from "../models/CareReport.js";
import { HttpError } from "../utils/httpError.js";

export async function getReport(req, res, next) {
  try {
    const report = await CareReport.findOne({ _id: req.params.id, user: req.user.sub }).lean();
    if (!report) throw new HttpError(404, "Report not found.");
    res.json(report);
  } catch (error) {
    next(error);
  }
}
