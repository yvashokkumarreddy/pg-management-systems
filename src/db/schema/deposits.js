import {
  pgTable,
  varchar,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants.js";

export const tenantDeposits = pgTable(
  "tenant_deposits",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    tenantId: varchar("tenant_id", {
      length: 36,
    })
      .notNull()
      .unique()
      .references(() => tenants.id),

    advanceAmount: decimal("advance_amount", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),

    maintenanceAmount: decimal(
      "maintenance_amount",
      {
        precision: 10,
        scale: 2,
      }
    )
      .notNull()
      .default("0"),

    refundableAmount: decimal(
      "refundable_amount",
      {
        precision: 10,
        scale: 2,
      }
    )
      .notNull()
      .default("0"),

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