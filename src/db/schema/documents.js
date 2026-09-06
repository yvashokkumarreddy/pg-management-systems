import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
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
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    tenantId: varchar("tenant_id")
      .notNull()
      .references(
        () => tenants.id,
        {
          onDelete: "restrict",
        }
      ),

    documentType: documentTypeEnum(
      "type"
    ).notNull(),

    documentSide: documentSideEnum(
      "side"
    ),

    storagePath: text(
      "storage_path"
    ).notNull(),

    status: documentStatusEnum(
      "status"
    )
      .notNull()
      .default("ACTIVE"),

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
    tenantDocumentLookupIdx:
      uniqueIndex(
        "tenant_documents_tenant_type_side_status_idx"
      ).on(
        table.tenantId,
        table.documentType,
        table.documentSide,
        table.status
      ),
  })
);