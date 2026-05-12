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

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function getUserId(req: any): string {
  return req.session?.userId;
}

function buildProfileContext(profile: any): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.weightKg) parts.push(`Weight: ${profile.weightKg}kg`);
  if (profile.heightCm) parts.push(`Height: ${profile.heightCm}cm`);
  if (profile.dietType) parts.push(`Diet: ${profile.dietType}`);
  if (profile.healthGoals?.length) parts.push(`Goals: ${profile.healthGoals.join(", ")}`);
  if (profile.allergies?.length) parts.push(`Allergies/Intolerances: ${profile.allergies.join(", ")} — NEVER suggest foods with these`);
  if (profile.dailyCalorieTarget) parts.push(`Daily calorie target: ${profile.dailyCalorieTarget} kcal`);
  return parts.join(" | ");
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

  // ── AI Chat (streaming) ────────────────────────────────────────────────────────
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

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    const conversationId = Number(req.params.id);
    const { content } = req.body;
    try {
      await storage.createMessage({ conversationId, role: "user", content });

      const userId = getUserId(req);
      const [history, pantry, profile] = await Promise.all([
        storage.getMessages(conversationId),
        storage.getPantryItems(userId),
        storage.getHealthProfile(userId),
      ]);

      const chatMessages = history.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const pantryList = pantry.length
        ? pantry.map((p) => `${p.name}${p.quantity ? ` (${p.quantity}${p.unit ? " " + p.unit : ""})` : ""}`).join(", ")
        : "no items tracked yet";

      const profileCtx = buildProfileContext(profile);

      const systemInstruction = `You are NutriSense AI — a warm, knowledgeable nutrition and kitchen assistant built specifically for Indian households.

USER PROFILE: ${profileCtx || "Not set up yet"}
CURRENT PANTRY: ${pantryList}

Your role:
- Help manage their digital pantry, suggest recipes using their actual pantry items
- Give personalised nutrition advice based on their diet type (${profile?.dietType || "vegetarian by default"}) and health goals
- STRICTLY avoid any foods they are allergic to: ${profile?.allergies?.length ? profile.allergies.join(", ") : "none listed"}
- Suggest Indian meals, cooking tips, and nutrition facts in the context of Indian cuisine
- Be culturally aware — mention specific Indian ingredients (dal, roti, sabzi, masalas, chaas, etc.)
- Keep calorie suggestions aligned with their target of ${profile?.dailyCalorieTarget || 2000} kcal/day
- Be warm, practical, and concise. Use bullet points for lists. Respond in the same language the user writes in.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

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

  // ── AI Nutrition Plan ─────────────────────────────────────────────────────────
  app.post("/api/ai/nutrition-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const [pantry, profile] = await Promise.all([
        storage.getPantryItems(userId),
        storage.getHealthProfile(userId),
      ]);

      const pantryList = pantry.length
        ? pantry.map((p) => `${p.name} (${p.quantity || "some"} ${p.unit || ""})`).join(", ")
        : "typical Indian kitchen staples (rice, dal, sabzi, roti)";

      const expiringItems = pantry.filter((p) => {
        if (!p.expiresAt) return false;
        const days = Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / 86400000);
        return days <= 5;
      });

      const profileCtx = buildProfileContext(profile);

      const prompt = `You are NutriSense AI, a nutrition expert for Indian households.

USER PROFILE: ${profileCtx || "No profile data — assume moderate Indian adult"}

PANTRY ITEMS AVAILABLE: ${pantryList}

${expiringItems.length > 0 ? `⚠️ ITEMS EXPIRING SOON (use these first): ${expiringItems.map((e) => e.name).join(", ")}` : ""}

Create a practical ONE-DAY Indian meal plan using the available pantry items. Requirements:
- Match their diet type strictly: ${profile?.dietType || "Vegetarian"}
- Target approximately ${profile?.dailyCalorieTarget || 2000} kcal total for the day
- AVOID all allergens: ${profile?.allergies?.length ? profile.allergies.join(", ") : "none"}
- Prioritise any expiring items if listed above
- Include Breakfast, Lunch, Evening Snack, and Dinner
- For each meal: name, key ingredients from pantry, estimated calories
- End with a brief nutrition tip relevant to their main health goal: ${profile?.healthGoals?.[0] || "general wellness"}

Format clearly with meal headers and bullet points.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 1200 },
      });

      res.json({ plan: response.text });
    } catch (e: any) {
      console.error("Nutrition plan error:", e);
      res.status(500).json({ message: "Failed to generate nutrition plan" });
    }
  });

  // ── AI Quick Scan (kitchen staples check) ────────────────────────────────────
  app.post("/api/ai/quick-scan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { answers } = req.body;

      const present = Object.entries(answers)
        .filter(([, v]) => v === "yes")
        .map(([k]) => k);

      const profile = await storage.getHealthProfile(userId);

      const nameMap: Record<string, string> = {
        jeera: "Jeera (Cumin Seeds)",
        haldi: "Haldi (Turmeric)",
        "curry-leaves": "Curry Leaves",
        moringa: "Moringa Powder",
      };

      const prompt = `You are NutriSense AI, a nutrition expert for Indian kitchens.

The user has confirmed these staple items at home: ${present.map((k) => nameMap[k] || k).join(", ")}.

${profile ? `User profile: ${profile.dietType || "Vegetarian"} diet | Goals: ${(profile.healthGoals || []).join(", ") || "general wellness"} | Avoid: ${(profile.allergies || []).join(", ") || "nothing"}` : ""}

Suggest 2-3 quick, healthy Indian recipes they can make RIGHT NOW with these ingredients (plus common Indian pantry basics like onion, tomato, oil, salt). 

For each recipe:
- Recipe name (authentic Indian name)
- Time to make
- Key health benefit (1 line)
- Basic steps (3-4 bullet points)

Keep it practical, inspiring, and culturally authentic.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 700 },
      });

      // Add confirmed items to pantry
      for (const item of present) {
        const exists = (await storage.getPantryItems(userId)).find(
          (p) => p.name.toLowerCase().includes((nameMap[item] || item).toLowerCase().split(" ")[0])
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

  // ── AI Scan Item from Image ───────────────────────────────────────────────────
  app.post("/api/ai/scan-item", isAuthenticated, async (req: any, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) return res.status(400).json({ message: "No image provided" });

      const prompt = `You are a food recognition AI for an Indian household pantry app.

Analyse this image and identify the food item, ingredient, or grocery product shown.

Respond ONLY with valid JSON (no markdown, no code block) in exactly this format:
{
  "name": "item name in English (e.g. Moong Dal, Basmati Rice, Amul Butter)",
  "category": "one of: Grains & Pulses | Fresh Produce | Spices & Condiments | Dairy | Superfoods | Snacks | Beverages | Other",
  "quantity": "estimated quantity if visible (e.g. 500, 1, 2) or empty string",
  "unit": "unit if visible (e.g. g, kg, litre, pieces) or empty string"
}

If you cannot identify a food item, respond: {"name": "", "category": "Other", "quantity": "", "unit": ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        config: { maxOutputTokens: 200 },
      });

      const text = (response.text || "").trim();
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        res.json(parsed);
      } catch {
        res.json({ name: "", category: "Other", quantity: "", unit: "" });
      }
    } catch (e: any) {
      console.error("Scan item error:", e);
      res.status(500).json({ message: "Failed to scan image" });
    }
  });

  // ── AI Scan Expiry Date from Image ────────────────────────────────────────────
  app.post("/api/ai/scan-expiry", isAuthenticated, async (req: any, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) return res.status(400).json({ message: "No image provided" });

      const prompt = `You are a food packaging reader AI.

Look at this image carefully for ANY expiry date, best before date, use by date, or manufacturing date printed on the packaging.

Common formats on Indian packaging: DD/MM/YYYY, MM/YYYY, MM-YYYY, "Best Before: Jan 2026", "Exp: 12/26", "BB: 06-2025", etc.

Respond ONLY with valid JSON (no markdown, no code block):
- If you find an expiry/best-before date: {"expiresAt": "YYYY-MM-DD", "retryOtherSide": false}
- If the date is not visible on this side of the packaging: {"expiresAt": null, "retryOtherSide": true}  
- If no date exists at all: {"expiresAt": null, "retryOtherSide": false}

Convert any found date to YYYY-MM-DD format. If only month/year found, use the last day of that month.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        config: { maxOutputTokens: 100 },
      });

      const text = (response.text || "").trim();
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        res.json(parsed);
      } catch {
        res.json({ expiresAt: null, retryOtherSide: true });
      }
    } catch (e: any) {
      console.error("Scan expiry error:", e);
      res.status(500).json({ message: "Failed to scan expiry date" });
    }
  });

  return httpServer;
}
