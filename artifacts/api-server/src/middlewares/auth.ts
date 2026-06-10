import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    (req as any).userId = payload.sub;
    (req as any).userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
