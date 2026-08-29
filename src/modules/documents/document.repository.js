import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import {
  tenantDocuments,
  tenants,
} from "@/db/schema";


/* ======================================================
   FIND TENANT FOR DOCUMENT OPERATIONS
====================================================== */

export async function findTenantForDocument(
  dbClient,
  tenantId,
  ownerId
) {
  const result =
    await dbClient
      .select({
        id:
          tenants.id,

        ownerId:
          tenants.ownerId,

        fullName:
          tenants.fullName,

        status:
          tenants.status,
      })
      .from(tenants)
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),
          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .limit(1);

  return result[0] ?? null;
}


/* ======================================================
   CREATE DOCUMENT
====================================================== */

export async function createTenantDocument(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        tenantDocuments
      )
      .values(data)
      .returning();

  return result[0] ?? null;
}


/* ======================================================
   FIND ACTIVE DOCUMENTS FOR TENANT
====================================================== */

export async function findActiveDocumentsByTenant(
  dbClient,
  tenantId
) {
  return await dbClient
    .select({
      id:
        tenantDocuments.id,

      tenantId:
        tenantDocuments.tenantId,

      documentType:
        tenantDocuments.documentType,

      documentSide:
        tenantDocuments.documentSide,

      storagePath:
        tenantDocuments.storagePath,

      status:
        tenantDocuments.status,

      createdAt:
        tenantDocuments.createdAt,

      updatedAt:
        tenantDocuments.updatedAt,
    })
    .from(
      tenantDocuments
    )
    .where(
      and(
        eq(
          tenantDocuments.tenantId,
          tenantId
        ),
        eq(
          tenantDocuments.status,
          "ACTIVE"
        )
      )
    )
    .orderBy(
      desc(
        tenantDocuments.createdAt
      )
    );
}


/* ======================================================
   FIND ALL DOCUMENTS FOR TENANT
   ACTIVE + ARCHIVED
====================================================== */

export async function findAllDocumentsByTenant(
  dbClient,
  tenantId
) {
  return await dbClient
    .select({
      id:
        tenantDocuments.id,

      tenantId:
        tenantDocuments.tenantId,

      documentType:
        tenantDocuments.documentType,

      documentSide:
        tenantDocuments.documentSide,

      storagePath:
        tenantDocuments.storagePath,

      status:
        tenantDocuments.status,

      createdAt:
        tenantDocuments.createdAt,

      updatedAt:
        tenantDocuments.updatedAt,
    })
    .from(
      tenantDocuments
    )
    .where(
      eq(
        tenantDocuments.tenantId,
        tenantId
      )
    )
    .orderBy(
      desc(
        tenantDocuments.createdAt
      )
    );
}


/* ======================================================
   FIND DOCUMENT BY ID
====================================================== */

export async function findDocumentById(
  dbClient,
  documentId,
  tenantId
) {
  const result =
    await dbClient
      .select({
        id:
          tenantDocuments.id,

        tenantId:
          tenantDocuments.tenantId,

        documentType:
          tenantDocuments.documentType,

        documentSide:
          tenantDocuments.documentSide,

        storagePath:
          tenantDocuments.storagePath,

        status:
          tenantDocuments.status,

        createdAt:
          tenantDocuments.createdAt,

        updatedAt:
          tenantDocuments.updatedAt,
      })
      .from(
        tenantDocuments
      )
      .where(
        and(
          eq(
            tenantDocuments.id,
            documentId
          ),
          eq(
            tenantDocuments.tenantId,
            tenantId
          )
        )
      )
      .limit(1);

  return result[0] ?? null;
}


/* ======================================================
   FIND ACTIVE AADHAAR SIDE

   Used when replacing:
   - AADHAAR FRONT
   - AADHAAR BACK
====================================================== */

export async function findActiveAadhaarSide(
  dbClient,
  tenantId,
  side
) {
  const result =
    await dbClient
      .select({
        id:
          tenantDocuments.id,

        tenantId:
          tenantDocuments.tenantId,

        documentType:
          tenantDocuments.documentType,

        documentSide:
          tenantDocuments.documentSide,

        storagePath:
          tenantDocuments.storagePath,

        status:
          tenantDocuments.status,
      })
      .from(
        tenantDocuments
      )
      .where(
        and(
          eq(
            tenantDocuments.tenantId,
            tenantId
          ),

          eq(
            tenantDocuments.documentType,
            "AADHAAR"
          ),

          eq(
            tenantDocuments.documentSide,
            side
          ),

          eq(
            tenantDocuments.status,
            "ACTIVE"
          )
        )
      )
      .limit(1);

  return result[0] ?? null;
}


/* ======================================================
   ARCHIVE DOCUMENT
====================================================== */

export async function archiveTenantDocument(
  dbClient,
  documentId
) {
  const result =
    await dbClient
      .update(
        tenantDocuments
      )
      .set({
        status:
          "ARCHIVED",

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          tenantDocuments.id,
          documentId
        )
      )
      .returning();

  return result[0] ?? null;
}