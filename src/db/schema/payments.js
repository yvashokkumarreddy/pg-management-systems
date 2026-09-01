import {
  pgTable,
  varchar,
  timestamp,
  date,
  decimal,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants.js";
import { rentBills } from "./rent-bills.js";

export const paymentModeEnum = pgEnum(
  "payment_mode",
  [
    "CASH",
    "UPI",
    "BANK_TRANSFER",
    "OTHER",
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: varchar("id", {
      length: 36,
    }).primaryKey(),

    tenantId: varchar("tenant_id", {
      length: 36,
    })
      .notNull()
      .references(() => tenants.id),

    rentBillId: varchar("rent_bill_id", {
      length: 36,
    })
      .notNull()
      .references(() => rentBills.id),

    amount: decimal("amount", {
      precision: 10,
      scale: 2,
    }).notNull(),

    paymentDate: date(
      "payment_date"
    ).notNull(),

    mode: paymentModeEnum(
      "mode"
    ).notNull(),

    notes: varchar("notes", {
      length: 500,
    }),

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
    tenantIdx: index(
      "payments_tenant_idx"
    ).on(table.tenantId),

    rentBillIdx: index(
      "payments_rent_bill_idx"
    ).on(table.rentBillId),

    paymentDateIdx: index(
      "payments_payment_date_idx"
    ).on(table.paymentDate),
  })
);