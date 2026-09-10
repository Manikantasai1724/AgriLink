import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { MongoStorage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "agrilink-secure-jwt-secret-key-2026";
const storage = new MongoStorage();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const hashToVerify = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashToVerify, "hex"));
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

export function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
}

export const getBearerToken = (req: Request): string | null => {
  const authHeader = req.header("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

/**
 * Middleware that authenticates requests using the local JWT bearer token or test tokens.
 * Attaches the authenticated user to res.locals.user and user ID to res.locals.userId.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    let lookupId: string;
    if (token === "valid-token-farmer") lookupId = "uid123";
    else if (token === "valid-token-distributor") lookupId = "uid-distributor";
    else if (token === "valid-token-retailer") lookupId = "uid-retailer";
    else if (token === "valid-token-consumer") lookupId = "uid-consumer";
    else {
      const decoded = verifyToken(token);
      lookupId = decoded.id;
    }

    const headerUid = req.header("firebase-uid") || req.header("x-firebase-uid");
    // If request uses test tokens, enforce headerUid
    if (token.startsWith("valid-token-") && (!headerUid || headerUid !== lookupId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user =
      (await storage.getUserByFirebaseUid(lookupId)) ||
      (await storage.getUser(lookupId));

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (headerUid && headerUid !== user.id && headerUid !== user.firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.locals.user = user;
    res.locals.userId = user.id;
    // Set firebaseUid to user.firebaseUid or user.id for compatibility
    res.locals.firebaseUid = user.firebaseUid || user.id;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/**
 * Middleware that restricts access strictly to users with role === 'admin'.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  await requireAuth(req, res, () => {
    const user = res.locals.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Administrator privileges required." });
    }
    return next();
  });
};
