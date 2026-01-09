
import { db } from "./db";
import {
  userSettings,
  type InsertUserSettings,
  type UserSettings
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { and, sql } from "drizzle-orm";

export interface IStorage {
  getUserSettings(sessionId: string): Promise<UserSettings | undefined>;
  saveUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUserSettings(sessionId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.sessionId, sessionId));
    return settings;
  }

  async saveUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    // Upsert
    const existing = await this.getUserSettings(settings.sessionId);
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set(settings)
        .where(eq(userSettings.sessionId, settings.sessionId))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(userSettings).values(settings).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
