import {
  pgTable,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  authUserId: varchar(
      "auth_user_id",
      {
        length: 36,
      }
    ).unique(),

  name: varchar("name", { length: 100 }),

  phone: varchar("phone", { length: 20 })
    .unique(),

  email: varchar("email", { length: 255 }).unique(),

  status: userStatusEnum("status")
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});