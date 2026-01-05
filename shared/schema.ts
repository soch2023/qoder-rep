
import { pgTable, text, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  preferences: jsonb("preferences").$type<{
    gameMode: 'local' | 'vsAI' | 'aiVsAi';
    aiDifficulty: number;
    boardOrientation?: 'white' | 'black';
    whiteAIDifficulty?: number;
    blackAIDifficulty?: number;
    playerColor?: 'w' | 'b';
  }>().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings);

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
