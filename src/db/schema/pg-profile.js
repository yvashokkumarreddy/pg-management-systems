import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const pgProfiles = pgTable(
  "pg_profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    ownerId: varchar("owner_id", {
      length: 36,
    })
      .notNull()
      .unique()
      .references(() => users.id),

    pgName: varchar("pg_name", {
      length: 200,
    }).notNull(),

    description: varchar("description", {
      length: 2000,
    }),

    address: varchar("address", {
      length: 500,
    }),

    contactNumber: varchar(
      "contact_number",
      { length: 20 }
    ),

    amenities: jsonb("amenities"),

    roomTypes: jsonb("room_types"),

    isPublished: boolean("is_published")
      .notNull()
      .default(false),

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
  }
);