import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createMemoryApp } from "./devMemoryApp.js";

connectDb()
  .then(() => app.listen(env.port, () => console.log(`Backend listening on ${env.port}`)))
  .catch((error) => {
    console.error("MongoDB connection failed", error.message);
    if (env.appEnv === "development") {
      createMemoryApp().listen(env.port, () => console.log(`Backend listening on ${env.port} with development memory storage`));
    } else {
      process.exit(1);
    }
  });
