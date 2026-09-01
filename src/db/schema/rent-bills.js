import {
  pgTable,
  varchar,
  timestamp,
  date,
  decimal,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants.js";

export const rentStatusEnum = pgEnum(
  "rent_status",
  [
    "PENDING",
    "PARTIAL",
    "PAID",
    "OVERDUE",
  ]
);

export const rentBills = pgTable(
  "rent_bills",
  {
    id: varchar("id", {
      length: 36,
    }).primaryKey(),

    tenantId: varchar("tenant_id", {
      length: 36,
    })
      .notNull()
      .references(() => tenants.id),

    // Calendar/business date
    billingPeriodStart: date(
      "billing_period_start"
    ).notNull(),

    // Calendar/business date
    billingPeriodEnd: date(
      "billing_period_end"
    ).notNull(),

    // Calendar/business date
    dueDate: date(
      "due_date"
    ).notNull(),

    amountDue: decimal("amount_due", {
      precision: 10,
      scale: 2,
    }).notNull(),

    amountPaid: decimal("amount_paid", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),

    balanceAmount: decimal(
      "balance_amount",
      {
        precision: 10,
        scale: 2,
      }
    )
      .notNull()
      .default("0"),

    status: rentStatusEnum("status")
      .notNull()
      .default("PENDING"),

    // Actual timestamp
    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    // Actual timestamp
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
    tenantPeriodUnique: unique(
      "tenant_rent_period_unique"
    ).on(
      table.tenantId,
      table.billingPeriodStart
    ),

    tenantIdx: index(
      "rent_bills_tenant_idx"
    ).on(table.tenantId),

    dueDateIdx: index(
      "rent_bills_due_date_idx"
    ).on(table.dueDate),

    statusIdx: index(
      "rent_bills_status_idx"
    ).on(table.status),
  })
);