import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
export type AuthUser = { id: string; role: "ADMIN" | "COURSE_VIEWER"; kind?: "COURSE_ACCESS"; accessEmailId?: string };
export type AuthRequest = Request & { user?: AuthUser };
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    if (user.role !== "ADMIN" || user.kind) return res.status(401).json({ error: "Invalid admin token" });
    req.user = user;
    return next();
  }
  catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}
export function optionalAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) { try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    if (user.role === "ADMIN" && !user.kind) req.user = user;
  } catch { /* unauthenticated requests remain public */ } }
  next();
}

export async function requireCourseAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Course access required" });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    if (user.role === "ADMIN" && !user.kind) { req.user = user; return next(); }
    if (user.kind !== "COURSE_ACCESS" || user.role !== "COURSE_VIEWER" || !user.accessEmailId) return res.status(401).json({ error: "Invalid course access token" });
    const accessEmail = await prisma.courseAccessEmail.findUnique({ where: { id: user.accessEmailId } });
    if (!accessEmail) return res.status(401).json({ error: "Course access has been revoked" });
    const expiresAt = accessEmail.expiresAt ?? new Date(accessEmail.createdAt.getTime() + (accessEmail.duration === "MONTH" ? 30 : 365) * 24 * 60 * 60 * 1000);
    if (expiresAt <= new Date()) return res.status(401).json({ error: "Course access has expired" });
    req.user = user;
    return next();
  } catch { return res.status(401).json({ error: "Invalid or expired course access token" }); }
}
