import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60,
    tableName: "sessions",
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nutrisense-secret-key",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // Register
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password required" });
      if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: "An account with this email already exists" });

      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        id: randomUUID(),
        email,
        password: hashed,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password" });

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  // Current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session?.userId) return next();
  res.status(401).json({ message: "Unauthorized" });
};
