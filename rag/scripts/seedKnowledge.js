import mongoose from "mongoose";
import dotenv from "dotenv";
import { KnowledgeBase } from "../../backend/src/models/KnowledgeBase.js";

dotenv.config({ path: ".env" });

const docs = [
  {
    source: "Project curated educational note",
    title: "When to seek professional skin evaluation",
    category: "triage",
    content:
      "Seek professional medical evaluation for rapidly changing lesions, bleeding, severe pain, spreading redness, pus, fever, swelling around the eyes or face, or symptoms that persist or worsen. AI tools can provide preliminary educational information only."
  },
  {
    source: "Project curated educational note",
    title: "General care for irritated skin",
    category: "general-care",
    content:
      "General skin care may include gentle cleansing, avoiding scratching, protecting the area from irritation, and using non-prescription moisturizers when appropriate. A pharmacist or dermatologist can advise whether a product is suitable."
  },
  {
    source: "Project curated educational note",
    title: "Understanding AI skin model confidence",
    category: "ai-explainability",
    content:
      "Model confidence is a statistical output from an academic machine-learning model. It is not medical certainty and should not be treated as a confirmed diagnosis."
  }
];

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/skincare_detection");
await KnowledgeBase.insertMany(docs);
await mongoose.disconnect();
console.log(`Seeded ${docs.length} trusted knowledge documents.`);
