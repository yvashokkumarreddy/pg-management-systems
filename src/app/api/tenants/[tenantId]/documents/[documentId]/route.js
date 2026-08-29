import {
  NextResponse,
} from "next/server";

import {
  archiveTenantDocumentService,
} from "@/modules/documents/document.service";

import {
  getCurrentOwner,
} from "@/modules/auth/auth.service";


export async function DELETE(
  request,
  { params }
) {
  try {
    const {
      tenantId,
      documentId,
    } = await params;


    const {
      ownerId,
    } =
      await getCurrentOwner();


    const result =
      await archiveTenantDocumentService(
        tenantId,
        documentId,
        ownerId
      );


    return NextResponse.json({
      success: true,

      message:
        "Document archived successfully",

      data:
        result,
    });

  } catch (error) {
    console.error(
      "Archive tenant document error:",
      error
    );


    let status = 500;


    if (
      error.message ===
      "Unauthorized"
    ) {
      status = 401;
    }


    if (
      error.message ===
        "Tenant not found" ||
      error.message ===
        "Document not found"
    ) {
      status = 404;
    }


    if (
      error.message ===
      "Document is already archived"
    ) {
      status = 400;
    }


    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to archive document",
      },
      {
        status,
      }
    );
  }
}