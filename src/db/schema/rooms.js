import {
  pgTable,
  varchar,
  integer,
  decimal,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
export const roomStatusEnum = pgEnum("room_status", [
  "ACTIVE",
  "ARCHIVED",
]);

export const rooms = pgTable(
  "rooms",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    ownerId: varchar("owner_id", { length: 36 })
      .notNull()
      .references(() => users.id),

    roomNumber: varchar("room_number", { length: 50 })
      .notNull(),

    floor: varchar("floor", { length: 50 }),

    capacity: integer("capacity").notNull(),

    rentPerBed: decimal("rent_per_bed", {
      precision: 10,
      scale: 2,
    }).notNull(),

    notes: varchar("notes", { length: 500 }),

    status: roomStatusEnum("status")
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
  },
  (table) => ({
    ownerRoomUnique: unique("owner_room_unique").on(
      table.ownerId,
      table.roomNumber
    ),

    ownerIdx: index("rooms_owner_idx").on(
      table.ownerId
    ),

    statusIdx: index("rooms_status_idx").on(
      table.status
    ),
  })
);