import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  question: text("question").notNull(),
  consentAt: text("consent_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("registration_event_email").on(table.eventId, table.email)]);
