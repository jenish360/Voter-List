import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPersonSchema, updatePersonSchema } from "@shared/schema";
import { z } from "zod";
import { fromError } from "zod-validation-error";

// Session user type
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Authentication middleware
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  }

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const user = await storage.createUser(data);
      req.session.userId = user.id;
      
      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await storage.verifyPassword(user, password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email 
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      id: user.id, 
      name: user.name, 
      email: user.email 
    });
  });

  // People Routes (all protected)
  app.get("/api/people", requireAuth, async (req, res) => {
    try {
      const searchQuery = req.query.search as string | undefined;
      const people = await storage.getPeopleByUserId(req.session.userId!, searchQuery);
      res.json(people);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch people" });
    }
  });

  app.get("/api/people/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/people/:id", requireAuth, async (req, res) => {
    try {
      const person = await storage.getPersonById(req.params.id, req.session.userId!);
      if (!person) {
        return res.status(404).json({ error: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch person" });
    }
  });

  app.post("/api/people", requireAuth, async (req, res) => {
    try {
      const data = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(data, req.session.userId!);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create person" });
    }
  });

  app.patch("/api/people/:id", requireAuth, async (req, res) => {
    try {
      const data = updatePersonSchema.parse(req.body);
      const person = await storage.updatePerson(req.params.id, req.session.userId!, data);
      if (!person) {
        return res.status(404).json({ error: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to update person" });
    }
  });

  app.post("/api/people/:id/toggle", requireAuth, async (req, res) => {
    try {
      const person = await storage.toggleMark(req.params.id, req.session.userId!);
      if (!person) {
        return res.status(404).json({ error: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle mark" });
    }
  });

  app.delete("/api/people/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deletePerson(req.params.id, req.session.userId!);
      if (!success) {
        return res.status(404).json({ error: "Person not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete person" });
    }
  });

  return httpServer;
}
