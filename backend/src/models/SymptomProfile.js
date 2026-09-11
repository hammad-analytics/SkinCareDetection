import mongoose from "mongoose";

const symptomProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symptoms: { type: String, required: true, maxlength: 2000 },
    duration: { type: String, required: true, maxlength: 200 },
    allergies: { type: String, maxlength: 1000 },
    history: { type: String, maxlength: 1500 },
    bodyArea: { type: String, maxlength: 200 },
    notes: { type: String, maxlength: 1500 }
  },
  { timestamps: true }
);

export const SymptomProfile = mongoose.model("SymptomProfile", symptomProfileSchema);
