import {
  pgTable,
  varchar,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants.js";

export const documentTypeEnum = pgEnum("document_type", [
  "AADHAAR",
  "PHOTO",
  "OTHER",
]);

export const tenantDocuments = pgTable(
  "tenant_documents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    tenantId: varchar("tenant_id", {
      length: 36,
    })
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    type: documentTypeEnum("type").notNull(),

    fileUrl: varchar("file_url", {
      length: 1000,
    }).notNull(),

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
    tenantIdx: index(
      "tenant_documents_tenant_idx"
    ).on(table.tenantId),
  })
);