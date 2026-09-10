import { Router } from "express";
import jwt from "jsonwebtoken";
import { CourseAccessDuration } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";

const emailInput = z.object({ email: z.string().trim().email().transform(value => value.toLowerCase()) });
const accessInput = emailInput.extend({ duration: z.enum(["MONTH", "YEAR"]).default("MONTH") });

function addDuration(from: Date, duration: CourseAccessDuration) {
  const result = new Date(from);
  if (duration === CourseAccessDuration.MONTH) result.setUTCDate(result.getUTCDate() + 30);
  else result.setUTCDate(result.getUTCDate() + 365);
  return result;
}

function effectiveExpiry(accessEmail: { expiresAt: Date | null; createdAt: Date; duration: CourseAccessDuration }) {
  return accessEmail.expiresAt ?? addDuration(accessEmail.createdAt, accessEmail.duration);
}
export const courseAccessRouter = Router();

courseAccessRouter.get("/emails", requireAdmin, async (_req, res, next) => {
  try {
    const emails = await prisma.courseAccessEmail.findMany({ orderBy: { createdAt: "desc" } });
    res.json(emails.map(email => ({ ...email, expiresAt: effectiveExpiry(email) })));
  }
  catch (error) { next(error); }
});

courseAccessRouter.post("/emails", requireAdmin, async (req, res, next) => {
  try {
    const { email, duration } = accessInput.parse(req.body);
    const durationValue = duration as CourseAccessDuration;
    res.status(201).json(await prisma.courseAccessEmail.create({
      data: { email, duration: durationValue, expiresAt: addDuration(new Date(), durationValue) },
    }));
  } catch (error) { next(error); }
});

courseAccessRouter.delete("/emails/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (!await prisma.courseAccessEmail.findUnique({ where: { id } })) return res.status(404).json({ error: "Access email not found" });
    await prisma.courseAccessEmail.delete({ where: { id } });
    res.status(204).end();
  } catch (error) { next(error); }
});

courseAccessRouter.post("/verify", async (req, res, next) => {
  try {
    const { email } = emailInput.parse(req.body);
    const accessEmail = await prisma.courseAccessEmail.findUnique({ where: { email } });
    if (!accessEmail) return res.status(403).json({ error: "This email is not registered for course access" });
    const expiresAt = effectiveExpiry(accessEmail);
    if (expiresAt <= new Date()) return res.status(403).json({ error: "This email's course access has expired" });
    const token = jwt.sign(
      { kind: "COURSE_ACCESS", role: "COURSE_VIEWER", accessEmailId: accessEmail.id, email: accessEmail.email },
      process.env.JWT_SECRET!,
      { expiresIn: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) },
    );
    res.json({ token });
  } catch (error) { next(error); }
});
