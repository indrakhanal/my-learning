import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { cacheGetWithStatus, cacheSet, cacheKeys, cacheDelete } from "../lib/cache.js";
export const tagsRouter = Router();
tagsRouter.get("/", async (_req, res, next) => { try { const cached = await cacheGetWithStatus<unknown[]>(cacheKeys.tags); res.setHeader("X-Cache-Status", cached.status); if (cached.value) return res.json(cached.value); const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } }); await cacheSet(cacheKeys.tags, tags); res.json(tags); } catch (e) { next(e); } });
tagsRouter.post("/", requireAdmin, async (req, res, next) => { try { const { name } = z.object({ name: z.string().trim().min(1).max(50) }).parse(req.body); const tag = await prisma.tag.create({ data: { name } }); await cacheDelete(cacheKeys.tags); res.status(201).json(tag); } catch (e) { next(e); } });
