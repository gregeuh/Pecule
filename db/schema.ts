import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const budgets = sqliteTable("budgets", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});
