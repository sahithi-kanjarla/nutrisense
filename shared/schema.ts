import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  numeric,
  timestamp,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Sessions (required for Replit Auth) ─────────────────────────────────────
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// ─── Users (Replit Auth) ──────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ─── Pantry Items ─────────────────────────────────────────────────────────────
export const pantryItems = pgTable("pantry_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("Other"),
  quantity: text("quantity"),
  unit: text("unit"),
  imageUrl: text("image_url"),
  imageBg: text("image_bg").default("#ffdeac"),
  expiresAt: timestamp("expires_at"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPantryItemSchema = createInsertSchema(pantryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPantryItem = z.infer<typeof insertPantryItemSchema>;
export type PantryItem = typeof pantryItems.$inferSelect;

// ─── Meals (Log Meal) ─────────────────────────────────────────────────────────
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mealType: text("meal_type").notNull().default("Lunch"), // Breakfast, Lunch, Dinner, Snack
  calories: integer("calories"),
  protein: numeric("protein"),
  carbs: numeric("carbs"),
  fats: numeric("fats"),
  fiber: numeric("fiber"),
  items: text("items").array().default(sql`'{}'::text[]`),
  imageUrl: text("image_url"),
  loggedAt: timestamp("logged_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
});
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

// ─── AI Conversations ─────────────────────────────────────────────────────────
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// ─── Health Profile ────────────────────────────────────────────────────────────
export const healthProfiles = pgTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  weightKg: numeric("weight_kg"),
  heightCm: numeric("height_cm"),
  dietType: text("diet_type").default("Vegetarian"), // Vegetarian, Vegan, Non-Veg, Jain
  allergies: text("allergies").array().default(sql`'{}'::text[]`),
  healthGoals: text("health_goals").array().default(sql`'{}'::text[]`),
  dailyCalorieTarget: integer("daily_calorie_target").default(2000),
  waterIntakeLitres: numeric("water_intake_litres").default("2.5"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHealthProfileSchema = createInsertSchema(healthProfiles).omit({
  id: true,
  updatedAt: true,
});
export type InsertHealthProfile = z.infer<typeof insertHealthProfileSchema>;
export type HealthProfile = typeof healthProfiles.$inferSelect;

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  pantryItems: many(pantryItems),
  meals: many(meals),
  conversations: many(conversations),
  healthProfile: one(healthProfiles, {
    fields: [users.id],
    references: [healthProfiles.userId],
  }),
}));

export const pantryItemsRelations = relations(pantryItems, ({ one }) => ({
  user: one(users, { fields: [pantryItems.userId], references: [users.id] }),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, { fields: [meals.userId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const healthProfilesRelations = relations(healthProfiles, ({ one }) => ({
  user: one(users, { fields: [healthProfiles.userId], references: [users.id] }),
}));
