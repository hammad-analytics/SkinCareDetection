import test from "node:test";
import assert from "node:assert/strict";
import { assessRisk } from "../src/services/riskService.js";

test("red flags produce high risk", () => {
  const risk = assessRisk({ symptoms: { symptoms: "severe pain and bleeding" }, modelResult: { confidence: 0.8 } });
  assert.equal(risk.level, "HIGH");
});

test("low confidence produces medium risk", () => {
  const risk = assessRisk({ symptoms: { symptoms: "mild rash" }, modelResult: { confidence: 0.2 } });
  assert.equal(risk.level, "MEDIUM");
});
