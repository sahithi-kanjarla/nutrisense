import { db } from "./db";
import {
  users, pantryItems, meals, conversations, messages, healthProfiles,
  type User, type UpsertUser,
  type PantryItem, type InsertPantryItem,
  type Meal, type InsertMeal,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type HealthProfile, type InsertHealthProfile,
} from "@shared/schema";
import { eq, desc, and, lte, gte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Pantry
  getPantryItems(userId: string): Promise<PantryItem[]>;
  getPantryItem(id: number): Promise<PantryItem | undefined>;
  createPantryItem(item: InsertPantryItem): Promise<PantryItem>;
  updatePantryItem(id: number, item: Partial<InsertPantryItem>): Promise<PantryItem | undefined>;
  deletePantryItem(id: number): Promise<void>;
  getExpiringItems(userId: string, withinDays?: number): Promise<PantryItem[]>;

  // Meals
  getMeals(userId: string): Promise<Meal[]>;
  getMeal(id: number): Promise<Meal | undefined>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;

  // Conversations
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(convo: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;

  // Health Profile
  getHealthProfile(userId: string): Promise<HealthProfile | undefined>;
  upsertHealthProfile(profile: InsertHealthProfile): Promise<HealthProfile>;
}

class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  // Pantry
  async getPantryItems(userId: string): Promise<PantryItem[]> {
    return db.select().from(pantryItems).where(eq(pantryItems.userId, userId)).orderBy(desc(pantryItems.createdAt));
  }

  async getPantryItem(id: number): Promise<PantryItem | undefined> {
    const [item] = await db.select().from(pantryItems).where(eq(pantryItems.id, id));
    return item;
  }

  async createPantryItem(item: InsertPantryItem): Promise<PantryItem> {
    const [created] = await db.insert(pantryItems).values(item).returning();
    return created;
  }

  async updatePantryItem(id: number, item: Partial<InsertPantryItem>): Promise<PantryItem | undefined> {
    const [updated] = await db
      .update(pantryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(pantryItems.id, id))
      .returning();
    return updated;
  }

  async deletePantryItem(id: number): Promise<void> {
    await db.delete(pantryItems).where(eq(pantryItems.id, id));
  }

  async getExpiringItems(userId: string, withinDays = 3): Promise<PantryItem[]> {
    const now = new Date();
    const limit = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return db
      .select()
      .from(pantryItems)
      .where(
        and(
          eq(pantryItems.userId, userId),
          lte(pantryItems.expiresAt, limit),
          gte(pantryItems.expiresAt, now),
        ),
      )
      .orderBy(pantryItems.expiresAt);
  }

  // Meals
  async getMeals(userId: string): Promise<Meal[]> {
    return db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.loggedAt));
  }

  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [created] = await db.insert(meals).values(meal).returning();
    return created;
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(meals).where(eq(meals.id, id));
  }

  // Conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [convo] = await db.select().from(conversations).where(eq(conversations.id, id));
    return convo;
  }

  async createConversation(convo: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(convo).returning();
    return created;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Messages
  async getMessages(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  // Health Profile
  async getHealthProfile(userId: string): Promise<HealthProfile | undefined> {
    const [profile] = await db.select().from(healthProfiles).where(eq(healthProfiles.userId, userId));
    return profile;
  }

  async upsertHealthProfile(profile: InsertHealthProfile): Promise<HealthProfile> {
    const [upserted] = await db
      .insert(healthProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: healthProfiles.userId,
        set: { ...profile, updatedAt: new Date() },
      })
      .returning();
    return upserted;
  }
}

export const storage = new DatabaseStorage();
