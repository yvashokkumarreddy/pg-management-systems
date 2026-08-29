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
  "tanent-documents";

const SIGNED_URL_EXPIRY_SECONDS =
  60 * 10;


/* ======================================================
   SANITIZE FILE NAME
====================================================== */

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


/* ======================================================
   RESOLVE CONTENT TYPE
====================================================== */

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


/* ======================================================
   BUILD STORAGE FOLDER
====================================================== */

function buildStorageFolder(
  documentType,
  documentSide
) {
  if (
    documentType === "AADHAAR"
  ) {
    return `aadhaar/${documentSide.toLowerCase()}`;
  }


  if (
    documentType === "PHOTO"
  ) {
    return "photo";
  }


  return "other";
}


/* ======================================================
   CREATE PRIVATE SIGNED URL
====================================================== */

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


  return (
    data?.signedUrl ??
    null
  );
}


/* ======================================================
   UPLOAD TENANT DOCUMENT
====================================================== */

export async function uploadTenantDocumentService({
  tenantId,
  ownerId,
  documentType,
  documentSide,
  file,
}) {
  /* ----------------------------------------------------
     VERIFY TENANT OWNERSHIP
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     NORMALIZE DOCUMENT SIDE
  ---------------------------------------------------- */

  const normalizedSide =
    documentType ===
    "AADHAAR"
      ? documentSide
      : null;


  /*
   * Aadhaar must always have
   * FRONT or BACK.
   */
  if (
    documentType ===
      "AADHAAR" &&
    !normalizedSide
  ) {
    throw new Error(
      "Document side is required for Aadhaar"
    );
  }


  /* ----------------------------------------------------
     GENERATE DOCUMENT ID
  ---------------------------------------------------- */

  const documentId =
    crypto.randomUUID();


  /* ----------------------------------------------------
     PREPARE STORAGE PATH
  ---------------------------------------------------- */

  const cleanFileName =
    sanitizeFileName(
      file.name
    );


  const folder =
    buildStorageFolder(
      documentType,
      normalizedSide
    );


  const storagePath =
    `${ownerId}/${tenantId}/${folder}/${documentId}-${cleanFileName}`;


  /* ----------------------------------------------------
     FILE → BUFFER
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     UPLOAD TO PRIVATE SUPABASE STORAGE
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     CREATE DATABASE RECORD
  ---------------------------------------------------- */

  try {
    const document =
      await db.transaction(
        async (tx) => {

          /*
           * Aadhaar FRONT / BACK each
           * support only one ACTIVE
           * document.
           *
           * Re-upload archives the
           * previous active side.
           */
          if (
            documentType ===
            "AADHAAR"
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

              documentType,

              documentSide:
                normalizedSide,

              storagePath,

              status:
                "ACTIVE",
            }
          );
        }
      );


    /* --------------------------------------------------
       CREATE SIGNED URL
    -------------------------------------------------- */

    const signedUrl =
      await createSignedUrl(
        document.storagePath
      );


    /* --------------------------------------------------
       API RESPONSE
    -------------------------------------------------- */

    return {
      id:
        document.id,

      tenantId:
        document.tenantId,

      documentType:
        document.documentType,

      documentSide:
        document.documentSide,

      storagePath:
        document.storagePath,

      signedUrl,

      status:
        document.status,

      createdAt:
        document.createdAt,

      updatedAt:
        document.updatedAt,
    };

  } catch (error) {
    /*
     * Database operation failed after
     * Storage upload.
     *
     * Remove only the newly uploaded
     * object to avoid an orphaned file.
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


/* ======================================================
   GET TENANT DOCUMENTS
====================================================== */

export async function getTenantDocumentsService(
  tenantId,
  ownerId,
  includeArchived = false
) {
  /* ----------------------------------------------------
     VERIFY TENANT OWNERSHIP
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     FETCH DOCUMENT RECORDS
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     CREATE SIGNED URL FOR EACH DOCUMENT
  ---------------------------------------------------- */

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

            tenantId:
              document.tenantId,

            documentType:
              document.documentType,

            documentSide:
              document.documentSide,

            storagePath:
              document.storagePath,

            signedUrl,

            status:
              document.status,

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


/* ======================================================
   ARCHIVE TENANT DOCUMENT
====================================================== */

export async function archiveTenantDocumentService(
  tenantId,
  documentId,
  ownerId
) {
  /* ----------------------------------------------------
     VERIFY TENANT OWNERSHIP
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     FIND DOCUMENT
  ---------------------------------------------------- */

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


  /* ----------------------------------------------------
     PREVENT DOUBLE ARCHIVE
  ---------------------------------------------------- */

  if (
    document.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Document is already archived"
    );
  }


  /* ----------------------------------------------------
     SOFT ARCHIVE
  ---------------------------------------------------- */

  const archivedDocument =
    await archiveTenantDocument(
      db,
      documentId
    );


  /*
   * IMPORTANT:
   *
   * Do NOT remove the Storage object.
   *
   * Historical document records and
   * their Storage objects are preserved.
   */


  return {
    id:
      archivedDocument.id,

    tenantId:
      archivedDocument.tenantId,

    documentType:
      archivedDocument.documentType,

    documentSide:
      archivedDocument.documentSide,

    status:
      archivedDocument.status,

    updatedAt:
      archivedDocument.updatedAt,
  };
}