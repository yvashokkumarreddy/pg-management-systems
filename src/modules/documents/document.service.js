import crypto from "crypto";

import { db } from "@/db";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

import {
  archiveTenantDocument,
  createTenantDocument,
  findActiveAadhaarSide,
  findActiveDocumentsByTenant,
  findAllDocumentsByTenant,
  findDocumentById,
  findTenantForDocument,
} from "./document.repository.js";


const BUCKET_NAME =
  "tenant-documents";

const SIGNED_URL_EXPIRY_SECONDS =
  60 * 10;


/*
 * Make filename safe for
 * Storage paths.
 */
function sanitizeFileName(
  fileName
) {
  return fileName
    .trim()
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    )
    .toLowerCase();
}


/*
 * Postman sometimes sends JPG
 * as application/octet-stream.
 *
 * Determine proper content type
 * from extension.
 */
function getContentType(
  file
) {
  if (
    file.type &&
    file.type !==
      "application/octet-stream"
  ) {
    return file.type;
  }

  const extension =
    file.name
      ?.split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension === "jpg" ||
    extension === "jpeg"
  ) {
    return "image/jpeg";
  }

  if (
    extension === "png"
  ) {
    return "image/png";
  }

  if (
    extension === "pdf"
  ) {
    return "application/pdf";
  }

  return "application/octet-stream";
}


function buildStorageFolder(
  type,
  side
) {
  if (type === "AADHAAR") {
    return (
      `aadhaar/${side.toLowerCase()}`
    );
  }

  if (type === "PHOTO") {
    return "photo";
  }

  return "other";
}


async function createSignedUrl(
  storagePath
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin.storage
      .from(
        BUCKET_NAME
      )
      .createSignedUrl(
        storagePath,
        SIGNED_URL_EXPIRY_SECONDS
      );

  if (error) {
    console.error(
      "Create signed URL error:",
      error
    );

    return null;
  }

  return data?.signedUrl ?? null;
}


export async function uploadTenantDocumentService({
  tenantId,
  ownerId,
  type,
  side,
  file,
}) {
  const tenant =
    await findTenantForDocument(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }


  /*
   * We allow document maintenance
   * even for archived tenants.
   *
   * Example:
   * owner may need historical
   * records after tenant leaves.
   */


  const normalizedSide =
    type === "AADHAAR"
      ? side
      : null;


  const documentId =
    crypto.randomUUID();


  const cleanFileName =
    sanitizeFileName(
      file.name
    );


  const folder =
    buildStorageFolder(
      type,
      normalizedSide
    );


  const storagePath =
    `${ownerId}/${tenantId}/${folder}/${documentId}-${cleanFileName}`;


  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer
    );


  const contentType =
    getContentType(
      file
    );


  /*
   * Upload new object first.
   */
  const {
    error: uploadError,
  } =
    await supabaseAdmin.storage
      .from(
        BUCKET_NAME
      )
      .upload(
        storagePath,
        buffer,
        {
          contentType,
          upsert: false,
        }
      );


  if (uploadError) {
    console.error(
      "Storage upload error:",
      uploadError
    );

    throw new Error(
      `Failed to upload document: ${uploadError.message}`
    );
  }


  try {
    const document =
      await db.transaction(
        async (tx) => {
          /*
           * Only one ACTIVE Aadhaar
           * FRONT and one ACTIVE BACK.
           *
           * Preserve previous row/file
           * as archived history.
           */
          if (
            type === "AADHAAR"
          ) {
            const existing =
              await findActiveAadhaarSide(
                tx,
                tenantId,
                normalizedSide
              );

            if (existing) {
              await archiveTenantDocument(
                tx,
                existing.id
              );
            }
          }


          return await createTenantDocument(
            tx,
            {
              id:
                documentId,

              tenantId,

              type,

              side:
                normalizedSide,

              storagePath,

              status:
                "ACTIVE",
            }
          );
        }
      );


    const signedUrl =
      await createSignedUrl(
        document.storagePath
      );


    return {
      id:
        document.id,

      tenantId:
        document.tenantId,

      type:
        document.type,

      side:
        document.side,

      fileUrl:
        signedUrl,

      status:
        document.status,

      createdAt:
        document.createdAt,
    };
  } catch (error) {
    /*
     * DB operation failed after
     * new Storage upload.
     *
     * Remove only the NEW orphaned
     * Storage object.
     */
    const {
      error:
        cleanupError,
    } =
      await supabaseAdmin.storage
        .from(
          BUCKET_NAME
        )
        .remove([
          storagePath,
        ]);

    if (cleanupError) {
      console.error(
        "Storage cleanup error:",
        cleanupError
      );
    }

    throw error;
  }
}


export async function getTenantDocumentsService(
  tenantId,
  ownerId,
  includeArchived = false
) {
  const tenant =
    await findTenantForDocument(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }


  const documents =
    includeArchived
      ? await findAllDocumentsByTenant(
          db,
          tenantId
        )
      : await findActiveDocumentsByTenant(
          db,
          tenantId
        );


  const result =
    await Promise.all(
      documents.map(
        async (document) => {
          const signedUrl =
            await createSignedUrl(
              document.storagePath
            );

          return {
            id:
              document.id,

            type:
              document.type,

            side:
              document.side,

            fileUrl:
              signedUrl,

            status:
              document.status,

            archivedAt:
              document.archivedAt ??
              null,

            createdAt:
              document.createdAt,

            updatedAt:
              document.updatedAt,
          };
        }
      )
    );


  return result;
}


export async function archiveTenantDocumentService(
  tenantId,
  documentId,
  ownerId
) {
  const tenant =
    await findTenantForDocument(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }


  const document =
    await findDocumentById(
      db,
      documentId,
      tenantId
    );


  if (!document) {
    throw new Error(
      "Document not found"
    );
  }


  if (
    document.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Document is already archived"
    );
  }


  await archiveTenantDocument(
    db,
    documentId
  );


  /*
   * IMPORTANT:
   *
   * Do NOT remove the Supabase
   * object here.
   *
   * Historical document records
   * are intentionally preserved.
   */


  return {
    id:
      documentId,

    status:
      "ARCHIVED",
  };
}