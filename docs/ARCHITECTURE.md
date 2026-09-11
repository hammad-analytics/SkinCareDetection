# Architecture

Frontend: React and Tailwind for mobile-first assessment workflow.

Backend: Node.js and Express expose auth, scans, reports, chat, and knowledge ingestion APIs. MongoDB stores users, scans, symptom profiles, chat sessions, reports, and trusted knowledge-base entries. Uploaded medical images are stored as protected file references, not MongoDB blobs.

ML service: FastAPI handles image validation, EXIF orientation correction, quality checks, preprocessing, TensorFlow/Keras model inference, and Grad-CAM generation. The training path is HAM10000-ready and uses a multimodal CNN + RNN architecture: EfficientNet-B0 for lesion images and a GRU branch for structured context/metadata tokens.

Assistant: Backend retrieves trusted knowledge from MongoDB text search, sends grounded context to Gemini or Ollama, then filters unsafe output before returning it. API keys stay in backend environment variables.
