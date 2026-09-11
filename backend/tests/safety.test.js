import test from "node:test";
import assert from "node:assert/strict";
import { filterAssistantText } from "../src/services/safetyService.js";

test("blocks personalized dosage text", () => {
  const result = filterAssistantText("Take amoxicillin 500mg twice daily for 5 days.");
  assert.equal(result.allowed, false);
  assert.match(result.text, /cannot provide personalized diagnosis/i);
});

test("allows general educational guidance", () => {
  const result = filterAssistantText("Use gentle cleansing and consider asking a dermatologist if symptoms worsen.");
  assert.equal(result.allowed, true);
});
