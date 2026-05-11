import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import {
  insertPantryItemSchema,
  insertMealSchema,
  insertHealthProfileSchema,
  insertConversationSchema,
} from "@shared/schema";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function getUserId(req: any): string {
  return req.user?.claims?.sub;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Pantry ───────────────────────────────────────────────────────────────────
  app.get("/api/pantry", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getPantryItems(getUserId(req));
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch pantry items" });
    }
  });

  app.post("/api/pantry", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertPantryItemSchema.parse({ ...req.body, userId: getUserId(req) });
      const item = await storage.createPantryItem(data);
      res.status(201).json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/pantry/:id", isAuthenticated, async (req: any, res) => {
    try {
      const item = await storage.updatePantryItem(Number(req.params.id), req.body);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/pantry/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deletePantryItem(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  app.get("/api/pantry/expiring", isAuthenticated, async (req: any, res) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 7;
      const items = await storage.getExpiringItems(getUserId(req), days);
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch expiring items" });
    }
  });

  // ── Meals ─────────────────────────────────────────────────────────────────────
  app.get("/api/meals", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getMeals(getUserId(req));
      res.json(items);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.post("/api/meals", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertMealSchema.parse({ ...req.body, userId: getUserId(req) });
      const meal = await storage.createMeal(data);
      res.status(201).json(meal);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/meals/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMeal(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // ── Health Profile ────────────────────────────────────────────────────────────
  app.get("/api/profile/health", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getHealthProfile(getUserId(req));
      res.json(profile || null);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch health profile" });
    }
  });

  app.put("/api/profile/health", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertHealthProfileSchema.parse({ ...req.body, userId: getUserId(req) });
      const profile = await storage.upsertHealthProfile(data);
      res.json(profile);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ── AI Chat ───────────────────────────────────────────────────────────────────
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const convos = await storage.getConversations(getUserId(req));
      res.json(convos);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertConversationSchema.parse({ title: req.body.title || "New Chat", userId: getUserId(req) });
      const convo = await storage.createConversation(data);
      res.status(201).json(convo);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteConversation(Number(req.params.id));
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const msgs = await storage.getMessages(Number(req.params.id));
      res.json(msgs);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // AI chat — streaming
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    const conversationId = Number(req.params.id);
    const { content } = req.body;
    try {
      await storage.createMessage({ conversationId, role: "user", content });

      const history = await storage.getMessages(conversationId);
      const chatMessages = history.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Build system instruction for NutriSense
      const systemInstruction = `You are NutriSense AI, a smart nutrition and pantry assistant for Indian households. 
You help users manage their digital pantry, suggest recipes using Indian ingredients like dal, rice, masalas, 
fresh vegetables, and more. Provide practical advice about Indian cooking, nutrition, and wellness. 
Be warm, helpful, and culturally aware of Indian dietary habits (vegetarian, vegan, Jain, etc.).`;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [...chatMessages, { role: "user", parts: [{ text: content }] }],
        config: { systemInstruction, maxOutputTokens: 2048 },
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.text || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      await storage.createMessage({ conversationId, role: "assistant", content: fullResponse });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      console.error("Chat error:", e);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI error" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: e.message });
      }
    }
  });

  // ── AI Nutrition Suggestion ───────────────────────────────────────────────────
  app.post("/api/ai/nutrition-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const [pantry, profile] = await Promise.all([
        storage.getPantryItems(userId),
        storage.getHealthProfile(userId),
      ]);

      const pantryList = pantry.map((p) => `${p.name} (${p.quantity || "some"} ${p.unit || ""})`).join(", ");
      const prompt = `Based on the following Indian pantry items: ${pantryList || "typical Indian kitchen staples"}
${profile ? `User profile: ${profile.dietType} diet, ${profile.age} years old, goal: ${(profile.healthGoals || []).join(", ")}` : ""}
Suggest a simple, nutritious one-day meal plan using these ingredients. Focus on Indian dishes. Keep it practical and healthy.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 1024 },
      });

      res.json({ plan: response.text });
    } catch (e: any) {
      console.error("Nutrition plan error:", e);
      res.status(500).json({ message: "Failed to generate nutrition plan" });
    }
  });

  // ── AI Quick Scan ─────────────────────────────────────────────────────────────
  app.post("/api/ai/quick-scan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { answers } = req.body; // { jeera: "yes", haldi: "yes", ... }

      const present = Object.entries(answers)
        .filter(([, v]) => v === "yes")
        .map(([k]) => k);

      const prompt = `A user has confirmed they have these items in their Indian kitchen: ${present.join(", ")}.
Suggest 2-3 quick, healthy recipes they can make with these staples. Keep suggestions simple and practical for daily Indian cooking.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 512 },
      });

      // Also add confirmed items to pantry
      for (const item of present) {
        const nameMap: Record<string, string> = {
          jeera: "Jeera (Cumin Seeds)",
          haldi: "Haldi (Turmeric)",
          "curry-leaves": "Curry Leaves",
          moringa: "Moringa Powder",
        };
        const exists = (await storage.getPantryItems(userId)).find(
          (p) => p.name.toLowerCase().includes(item.toLowerCase())
        );
        if (!exists) {
          await storage.createPantryItem({
            userId,
            name: nameMap[item] || item,
            category: "Spices & Condiments",
            quantity: "some",
            tags: ["Indian Spice"],
          });
        }
      }

      res.json({ suggestions: response.text });
    } catch (e: any) {
      console.error("Quick scan error:", e);
      res.status(500).json({ message: "Failed to process quick scan" });
    }
  });

  return httpServer;
}
