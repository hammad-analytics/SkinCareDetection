import axios from "axios";
import { createReadStream } from "node:fs";
import FormData from "form-data";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

async function postImage(endpoint, imagePath, fields = {}) {
  const form = new FormData();
  form.append("file", createReadStream(imagePath));
  Object.entries(fields).forEach(([key, value]) => form.append(key, value ?? ""));
  try {
    const { data } = await axios.post(`${env.mlServiceUrl}${endpoint}`, form, {
      headers: form.getHeaders(),
      timeout: 60000
    });
    return data;
  } catch (error) {
    throw new HttpError(503, "The image analysis service is unavailable or rejected the image.", {
      endpoint,
      service: env.mlServiceUrl
    });
  }
}

export const mlService = {
  qualityCheck: (imagePath) => postImage("/quality-check", imagePath),
  predict: (imagePath, context) => postImage("/predict", imagePath, { context }),
  gradcam: (imagePath) => postImage("/gradcam", imagePath)
};
