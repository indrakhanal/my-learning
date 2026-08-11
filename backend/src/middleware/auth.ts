import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
export type AuthRequest = Request & { user?: { id: string; role: "ADMIN" } };
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest["user"]; return next(); }
  catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}
export function optionalAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) { try { req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest["user"]; } catch { /* unauthenticated requests remain public */ } }
  next();
}
