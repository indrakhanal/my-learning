import express from "express";
import cors, { type CorsOptions } from "cors";
import { authRouter } from "./routes/auth.js";
import { notesRouter } from "./routes/notes.js";
import { tagsRouter } from "./routes/tags.js";
import { uploadsRouter } from "./routes/uploads.js";

const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, "");
const allowedOrigins = new Set((process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map(normalizeOrigin).filter(Boolean));
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized);
    if (allowedOrigins.has(normalized) || isVercelPreview) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${normalized}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

export const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/uploads", uploadsRouter);
app.use((error: any, _req: any, res: any, _next: any) => {
  if (error?.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: error.issues });
  if (error?.code === "P2002") return res.status(409).json({ error: "A record with that value already exists" });
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});
