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
  if (profile.allergies?.length) parts.push(`ALLERGIES (NEVER suggest): ${profile.allergies.join(", ")}`);
  if (profile.dailyCalorieTarget) parts.push(`Daily calorie target: ${profile.dailyCalorieTarget} kcal`);
  if (profile.aiPreferences) parts.push(`USER'S CUSTOM AI PREFERENCES: ${profile.aiPreferences}`);
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

  // ── AI Chat ────────────────────────────────────────────────────────────────────
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

      const systemInstruction = `You are NutriSense AI — a warm, knowledgeable nutrition and kitchen assistant for Indian households.
USER PROFILE: ${profileCtx || "Not set up yet"}
CURRENT PANTRY: ${pantryList}
- Help manage their pantry, suggest recipes using their actual pantry items
- Proactively suggest how to balance their diet based on their goals. For example, if they need more protein, check their CURRENT PANTRY for items like paneer or lentils and recommend eating them to complete their daily goal.
- ${profile?.dietType ? `Follow ${profile.dietType} diet strictly` : "Default to vegetarian suggestions"}
- STRICTLY avoid allergens: ${profile?.allergies?.length ? profile.allergies.join(", ") : "none listed"}
- Keep calories near ${profile?.dailyCalorieTarget || 2000} kcal/day target
- Be warm, practical, culturally aware of Indian cuisine. Use bullet points for lists.`;

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
USER PROFILE: ${profileCtx || "Moderate Indian adult, vegetarian by default"}
PANTRY ITEMS AVAILABLE: ${pantryList}
${expiringItems.length > 0 ? `⚠️ EXPIRING SOON (prioritise these): ${expiringItems.map((e) => e.name).join(", ")}` : ""}

Create a practical ONE-DAY Indian meal plan. Requirements:
- Diet type: ${profile?.dietType || "Vegetarian"} — follow strictly
- Target: ${profile?.dailyCalorieTarget || 2000} kcal total
- AVOID: ${profile?.allergies?.length ? profile.allergies.join(", ") : "none"}
- Use pantry items listed above wherever possible
- Prioritise expiring items if any

Format for each meal (Breakfast, Lunch, Evening Snack, Dinner):
**[Meal Name]** — [Time Suggestion]
• Dish: [Name] | Calories: [X] kcal | Protein: [X]g | Carbs: [X]g | Fat: [X]g | Iron: [X]mg
• Key ingredients: [list]
• Why it's good for you: [one line based on their goals]

End with: **Daily Total** — Calories: Xkcal | Protein: Xg | Carbs: Xg | Fat: Xg | Iron: Xmg
Then a 2-line **Nutrition tip** relevant to their goal: ${profile?.healthGoals?.[0] || "general wellness"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 1500 },
      });

      res.json({ plan: response.text });
    } catch (e: any) {
      console.error("Nutrition plan error:", e);
      res.status(500).json({ message: "Failed to generate nutrition plan" });
    }
  });

  // ── AI Meal Plan Follow-up (chat about plan) ──────────────────────────────────
  app.post("/api/ai/plan-followup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { plan, question } = req.body;
      const [pantry, profile] = await Promise.all([
        storage.getPantryItems(userId),
        storage.getHealthProfile(userId),
      ]);

      const profileCtx = buildProfileContext(profile);
      const prompt = `You are NutriSense AI. The user has received this meal plan:
---
${plan}
---
USER PROFILE: ${profileCtx}
PANTRY: ${pantry.map((p) => p.name).join(", ") || "standard Indian kitchen"}

The user asks: "${question}"

Answer helpfully. If they want to modify a meal, suggest an alternative using pantry items. If they ask about nutrition, give specific numbers. Keep response concise and practical.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 600 },
      });

      res.json({ answer: response.text });
    } catch (e: any) {
      console.error("Plan followup error:", e);
      res.status(500).json({ message: "Failed to get answer" });
    }
  });

  // ── AI Quick Scan (dynamic pantry suggestions) ────────────────────────────────
  app.post("/api/ai/quick-scan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { answers, items } = req.body;

      const present = (items as string[]).filter((_, i) => answers[i] === "yes");
      const profile = await storage.getHealthProfile(userId);
      const pantry = await storage.getPantryItems(userId);

      // Add confirmed items to pantry if not already there
      for (const itemName of present) {
        const exists = pantry.find((p) =>
          p.name.toLowerCase().includes(itemName.toLowerCase().split(" ")[0].toLowerCase())
        );
        if (!exists) {
          await storage.createPantryItem({
            userId,
            name: itemName,
            category: "Spices & Condiments",
            quantity: "some",
            tags: [],
          });
        }
      }

      const prompt = `You are NutriSense AI, a nutrition expert for Indian kitchens.
The user confirmed they have: ${present.length > 0 ? present.join(", ") : "none of the items listed"}.
They also have in their pantry: ${pantry.map((p) => p.name).join(", ") || "standard staples"}.

${profile ? `User profile: ${profile.dietType || "Vegetarian"} diet | Goals: ${(profile.healthGoals || []).join(", ") || "general wellness"} | AVOID allergens: ${(profile.allergies || []).join(", ") || "none"}` : ""}

Suggest 2-3 quick, healthy Indian recipes they can make RIGHT NOW. For each recipe:
**[Recipe Name]** ([time])
• Health benefit: [one line relevant to their goals]
• Key nutrients: Protein: Xg | Iron: Xmg | Carbs: Xg | Calories: ~X kcal
• Steps: [3-4 bullet points]
• Allergen note if any ingredients are common allergens.

Keep it practical and inspiring.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 800 },
      });

      res.json({ suggestions: response.text });
    } catch (e: any) {
      console.error("Quick scan error:", e);
      res.status(500).json({ message: "Failed to process quick scan" });
    }
  });

  // ── AI Scan Meal from Image ───────────────────────────────────────────────────
  app.post("/api/ai/scan-meal", isAuthenticated, async (req: any, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) return res.status(400).json({ message: "No image provided" });

      const userId = getUserId(req);
      const profile = await storage.getHealthProfile(userId);

      const prompt = `You are a meal recognition AI for an Indian nutrition app.
${profile?.allergies?.length ? `User is allergic to: ${profile.allergies.join(", ")} — flag if detected in food` : ""}

Analyse this food image and identify the Indian dish or meal shown.

Respond ONLY with valid JSON (no markdown, no code block):
{
  "name": "exact name of the dish (e.g. Dal Tadka, Chicken Biryani, Aloo Paratha)",
  "description": "brief description (1 line)",
  "servingSize": "typical serving description (e.g. 1 bowl ~250g, 2 pieces ~150g, 1 plate ~350g)",
  "defaultQty": "number only (e.g. 1, 2, 250)",
  "defaultUnit": "bowl / piece / plate / cup / g / slice",
  "allergyFlag": "empty string or allergen name if detected",
  "nutrition": {
    "calories": number per serving,
    "protein": number in grams per serving,
    "carbs": number in grams per serving,
    "fats": number in grams per serving,
    "fiber": number in grams per serving,
    "iron": number in mg per serving
  }
}

If you cannot identify the food: {"name": "", "description": "", "servingSize": "", "defaultQty": "1", "defaultUnit": "bowl", "allergyFlag": "", "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fats": 0, "fiber": 0, "iron": 0}}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        config: { maxOutputTokens: 400 },
      });

      const text = (response.text || "").trim().replace(/```json|```/g, "").trim();
      try {
        res.json(JSON.parse(text));
      } catch {
        res.json({ name: "", description: "", servingSize: "", defaultQty: "1", defaultUnit: "bowl", allergyFlag: "", nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, iron: 0 } });
      }
    } catch (e: any) {
      console.error("Scan meal error:", e);
      res.status(500).json({ message: "Failed to scan meal" });
    }
  });

  // ── AI Calculate Nutrition from food name + quantity ──────────────────────────
  app.post("/api/ai/calculate-nutrition", isAuthenticated, async (req: any, res) => {
    try {
      const { foodName, quantity, unit } = req.body;
      if (!foodName) return res.status(400).json({ message: "Food name required" });

      const prompt = `You are a nutrition calculator for Indian food.

Calculate the nutrition for: ${quantity} ${unit} of "${foodName}"

Units explanation:
- bowl = ~250ml/200-300g depending on food
- katori = ~150ml/100-150g  
- plate = ~350-400g
- cup = ~200ml/150-200g
- piece/slice = depends on food type (roti ~30g, paratha ~80g, idli ~50g, etc)
- tbsp = ~15g, tsp = ~5g
- whole = entire item (whole apple ~150g, whole banana ~120g, etc)
- handful = ~30-40g

Respond ONLY with valid JSON (no markdown):
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber": number,
  "iron": number,
  "servingDescription": "e.g. 1 bowl Dal Tadka (~250g)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 200 },
      });

      const text = (response.text || "").trim().replace(/```json|```/g, "").trim();
      try {
        res.json(JSON.parse(text));
      } catch {
        res.json({ calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, iron: 0, servingDescription: "" });
      }
    } catch (e: any) {
      console.error("Calculate nutrition error:", e);
      res.status(500).json({ message: "Failed to calculate nutrition" });
    }
  });

  // ── AI Scan Item from Image ───────────────────────────────────────────────────
  app.post("/api/ai/scan-item", isAuthenticated, async (req: any, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) return res.status(400).json({ message: "No image provided" });

      const prompt = `You are a food recognition AI for an Indian household pantry app.
Identify the food item, ingredient, or grocery product in this image.
Respond ONLY with valid JSON (no markdown):
{
  "name": "item name in English (e.g. Moong Dal, Basmati Rice, Amul Butter)",
  "category": "one of: Grains & Pulses | Fresh Produce | Spices & Condiments | Dairy | Superfoods | Snacks | Beverages | Other",
  "quantity": "estimated quantity if visible or empty string",
  "unit": "unit if visible (g, kg, litre, pieces) or empty string"
}
If unidentifiable: {"name": "", "category": "Other", "quantity": "", "unit": ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }],
        }],
        config: { maxOutputTokens: 200 },
      });

      const text = (response.text || "").trim().replace(/```json|```/g, "").trim();
      try {
        res.json(JSON.parse(text));
      } catch {
        res.json({ name: "", category: "Other", quantity: "", unit: "" });
      }
    } catch (e: any) {
      console.error("Scan item error:", e);
      res.status(500).json({ message: "Failed to scan image" });
    }
  });

  // ── AI Scan Expiry Date ───────────────────────────────────────────────────────
  app.post("/api/ai/scan-expiry", isAuthenticated, async (req: any, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) return res.status(400).json({ message: "No image provided" });

      const prompt = `Look at this image for any expiry, best before, or use-by date on packaging.
Common Indian formats: DD/MM/YYYY, MM/YYYY, MM-YYYY, "Best Before: Jan 2026", "Exp: 12/26", etc.
Respond ONLY with valid JSON:
- Found date: {"expiresAt": "YYYY-MM-DD", "retryOtherSide": false}
- Not visible on this side: {"expiresAt": null, "retryOtherSide": true}
- No date exists: {"expiresAt": null, "retryOtherSide": false}
Convert to YYYY-MM-DD. If only MM/YYYY, use last day of that month.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }],
        }],
        config: { maxOutputTokens: 100 },
      });

      const text = (response.text || "").trim().replace(/```json|```/g, "").trim();
      try {
        res.json(JSON.parse(text));
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
