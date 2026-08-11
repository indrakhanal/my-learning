import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";
export const tagsRouter = Router();
tagsRouter.get("/", async (_req, res, next) => { try { res.json(await prisma.tag.findMany({ orderBy: { name: "asc" } })); } catch (e) { next(e); } });
tagsRouter.post("/", requireAdmin, async (req, res, next) => { try { const { name } = z.object({ name: z.string().trim().min(1).max(50) }).parse(req.body); res.status(201).json(await prisma.tag.create({ data: { name } })); } catch (e) { next(e); } });
