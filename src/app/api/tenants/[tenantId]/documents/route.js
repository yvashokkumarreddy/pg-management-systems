import {
  NextResponse,
} from "next/server";

import {
  getTenantDocumentsService,
  uploadTenantDocumentService,
} from "@/modules/documents/document.service";

import {
  validateDocumentUpload,
} from "@/modules/documents/document.validation";

import {
  getCurrentOwner,
} from "@/modules/auth/auth.service";


export async function POST(
  request,
  { params }
) {
  try {
    const {
      tenantId,
    } = await params;


    const {
      ownerId,
    } =
      await getCurrentOwner();


    const formData =
      await request.formData();


    const documentTypeValue =
      formData.get(
        "documentType"
      );


    const documentSideValue =
      formData.get(
        "documentSide"
      );


    const documentType =
      typeof documentTypeValue ===
        "string" &&
      documentTypeValue.trim()
        ? documentTypeValue
            .trim()
            .toUpperCase()
        : null;


    const documentSide =
      typeof documentSideValue ===
        "string" &&
      documentSideValue.trim()
        ? documentSideValue
            .trim()
            .toUpperCase()
        : null;


    const file =
      formData.get(
        "file"
      );


    const validation =
      validateDocumentUpload({
        documentType,
        documentSide,
        file,
      });


    if (
      !validation.isValid
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            validation.errors.file,

          errors:
            validation.errors,
        },
        {
          status: 400,
        }
      );
    }


    const document =
      await uploadTenantDocumentService({
        tenantId,
        ownerId,
        documentType,
        documentSide,
        file,
      });


    return NextResponse.json(
      {
        success: true,

        message:
          "Document uploaded successfully",

        data:
          document,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Upload tenant document error:",
      error
    );


    const status =
      error.message ===
      "Tenant not found"
        ? 404
        : error.message ===
          "Unauthorized"
        ? 401
        : 400;


    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to upload document",
      },
      {
        status,
      }
    );
  }
}


export async function GET(
  request,
  { params }
) {
  try {
    const {
      tenantId,
    } = await params;


    const {
      searchParams,
    } =
      new URL(
        request.url
      );


    const {
      ownerId,
    } =
      await getCurrentOwner();


    const includeArchived =
      searchParams.get(
        "includeArchived"
      ) === "true";


    const documents =
      await getTenantDocumentsService(
        tenantId,
        ownerId,
        includeArchived
      );


    return NextResponse.json({
      success: true,

      data:
        documents,
    });

  } catch (error) {
    console.error(
      "Get tenant documents error:",
      error
    );


    const status =
      error.message ===
      "Tenant not found"
        ? 404
        : error.message ===
          "Unauthorized"
        ? 401
        : 500;


    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to get tenant documents",
      },
      {
        status,
      }
    );
  }
}