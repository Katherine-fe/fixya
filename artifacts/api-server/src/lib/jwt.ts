import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fixya-dev-secret-2026";

export interface TokenPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
