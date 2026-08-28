import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import {
  tenantDocuments,
  tenants,
} from "@/db/schema";


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

  return result[0];
}


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

      type:
        tenantDocuments.type,

      side:
        tenantDocuments.side,

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

      type:
        tenantDocuments.type,

      side:
        tenantDocuments.side,

      storagePath:
        tenantDocuments.storagePath,

      status:
        tenantDocuments.status,

      archivedAt:
        tenantDocuments.archivedAt,

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

        type:
          tenantDocuments.type,

        side:
          tenantDocuments.side,

        storagePath:
          tenantDocuments.storagePath,

        status:
          tenantDocuments.status,

        archivedAt:
          tenantDocuments.archivedAt,

        createdAt:
          tenantDocuments.createdAt,
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

        storagePath:
          tenantDocuments.storagePath,
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
            tenantDocuments.type,
            "AADHAAR"
          ),
          eq(
            tenantDocuments.side,
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


export async function archiveTenantDocument(
  dbClient,
  documentId
) {
  const now =
    new Date();

  const result =
    await dbClient
      .update(
        tenantDocuments
      )
      .set({
        status:
          "ARCHIVED",

        archivedAt:
          now,

        updatedAt:
          now,
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