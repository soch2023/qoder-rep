
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { Request, Response } from "express";

// Session ID validation regex - alphanumeric, 10-50 characters
const SESSION_ID_REGEX = /^[a-zA-Z0-9]{10,50}$/;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.settings.get.path, async (req, res) => {
    // Validate session ID format to prevent injection attacks
    const sessionId = req.params.sessionId;
    if (!SESSION_ID_REGEX.test(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID format" });
    }
    
    const settings = await storage.getUserSettings(sessionId);
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.json(settings);
  });

  app.post(api.settings.save.path, async (req, res) => {
    try {
      const input = api.settings.save.input.parse(req.body);
      const settings = await storage.saveUserSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      throw err;
    }
  });

  return httpServer;
}
