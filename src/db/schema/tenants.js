import {
  pgTable,
  varchar,
  timestamp,
  decimal,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { rooms } from "./rooms.js";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "ACTIVE",
  "NOTICE_PERIOD",
  "ARCHIVED",
]);

export const tenants = pgTable(
  "tenants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    ownerId: varchar("owner_id", { length: 36 })
      .notNull()
      .references(() => users.id),

    roomId: varchar("room_id", { length: 36 })
      .references(() => rooms.id),

    fullName: varchar("full_name", {
      length: 150,
    }).notNull(),

    mobile: varchar("mobile", {
      length: 20,
    }).notNull(),

    dateOfBirth: timestamp("date_of_birth", {
      withTimezone: true,
    }),

    emergencyContactName: varchar(
      "emergency_contact_name",
      { length: 150 }
    ),

    emergencyContactPhone: varchar(
      "emergency_contact_phone",
      { length: 20 }
    ),

    officeName: varchar("office_name", {
      length: 200,
    }),

    officeAddress: varchar("office_address", {
      length: 500,
    }),

    permanentAddress: varchar(
      "permanent_address",
      { length: 500 }
    ),

    dateOfJoining: timestamp("date_of_joining", {
      withTimezone: true,
    }).notNull(),

    dateOfLeaving: timestamp("date_of_leaving", {
      withTimezone: true,
    }),

    monthlyRent: decimal("monthly_rent", {
      precision: 10,
      scale: 2,
    }).notNull(),

    status: tenantStatusEnum("status")
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
    ownerIdx: index("tenants_owner_idx").on(
      table.ownerId
    ),

    roomIdx: index("tenants_room_idx").on(
      table.roomId
    ),

    statusIdx: index("tenants_status_idx").on(
      table.status
    ),

    mobileIdx: index("tenants_mobile_idx").on(
      table.mobile
    ),
  })
);