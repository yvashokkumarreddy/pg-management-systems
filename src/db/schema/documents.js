import {
  pgTable,
  varchar,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants.js";


export const documentTypeEnum = pgEnum(
  "document_type",
  [
    "AADHAAR",
    "PHOTO",
    "OTHER",
  ]
);


export const documentSideEnum = pgEnum(
  "document_side",
  [
    "FRONT",
    "BACK",
  ]
);


export const documentStatusEnum = pgEnum(
  "document_status",
  [
    "ACTIVE",
    "ARCHIVED",
  ]
);


export const tenantDocuments = pgTable(
  "tenant_documents",
  {
    id: varchar("id", {
      length: 36,
    }).primaryKey(),

    tenantId: varchar("tenant_id", {
      length: 36,
    })
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    type: documentTypeEnum(
      "type"
    ).notNull(),

    /*
     * Aadhaar:
     * FRONT / BACK
     *
     * PHOTO / OTHER:
     * null
     */
    side: documentSideEnum(
      "side"
    ),

    /*
     * Store private Supabase
     * object path, NOT signed URL.
     */
    storagePath: varchar(
      "storage_path",
      {
        length: 1000,
      }
    ).notNull(),

    status: documentStatusEnum(
      "status"
    )
      .notNull()
      .default("ACTIVE"),

    archivedAt: timestamp(
      "archived_at",
      {
        withTimezone: true,
      }
    ),

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
      "tenant_documents_tenant_idx"
    ).on(
      table.tenantId
    ),

    tenantTypeIdx: index(
      "tenant_documents_tenant_type_idx"
    ).on(
      table.tenantId,
      table.type
    ),

    statusIdx: index(
      "tenant_documents_status_idx"
    ).on(
      table.status
    ),
  })
);