import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";


export const pgProfiles = pgTable(
  "pg_profiles",
  {
    id: varchar("id", {
      length: 36,
    }).primaryKey(),

    ownerId: varchar("owner_id", {
      length: 36,
    })
      .notNull()
      .unique()
      .references(() => users.id),

    /*
     * Stable public URL identifier.
     *
     * Example:
     * sunrise-pg-a1b2c3
     */
    slug: varchar("slug", {
      length: 250,
    })
      .notNull()
      .unique(),

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
      {
        length: 20,
      }
    ),

    /*
     * Example:
     *
     * [
     *   "WIFI",
     *   "PARKING",
     *   "LAUNDRY",
     *   "AC"
     * ]
     */
    amenities: jsonb(
      "amenities"
    ),

    /*
     * Public-facing room
     * information.
     *
     * Example:
     *
     * [
     *   {
     *     "type": "Double Sharing",
     *     "rent": 8000
     *   }
     * ]
     */
    roomTypes: jsonb(
      "room_types"
    ),

    isPublished: boolean(
      "is_published"
    )
      .notNull()
      .default(false),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugIdx: index(
      "pg_profiles_slug_idx"
    ).on(table.slug),
  })
);