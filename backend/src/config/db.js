import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env.js";

export async function connectDb() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (dnsErr) {
    console.warn("DNS server setup warning:", dnsErr.message);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 7000 });
}
