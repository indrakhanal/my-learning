import { Router } from "express";
import { cacheStatus } from "../lib/cache.js";
import { requireAdmin } from "../middleware/auth.js";

export const cacheRouter = Router();
cacheRouter.get("/status", requireAdmin, (_req, res) => res.json(cacheStatus()));
