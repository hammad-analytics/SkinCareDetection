import mongoose from "mongoose";

const careReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scan: { type: mongoose.Schema.Types.ObjectId, ref: "SkinScan", required: true, index: true },
    content: { type: Object, required: true }
  },
  { timestamps: true }
);

export const CareReport = mongoose.model("CareReport", careReportSchema);
