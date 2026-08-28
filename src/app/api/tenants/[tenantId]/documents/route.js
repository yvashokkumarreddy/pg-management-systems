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
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function POST(
  request,
  { params }
) {
  try {
    const {
      tenantId,
    } =
      await params;


    const { ownerId } =
  await getCurrentOwner();


    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Owner ID is required",
        },
        {
          status: 400,
        }
      );
    }


    const formData =
      await request.formData();


    const type =
      formData.get(
        "type"
      );


    const sideValue =
      formData.get(
        "side"
      );


    const side =
      typeof sideValue === "string" &&
      sideValue.trim()
        ? sideValue
            .trim()
            .toUpperCase()
        : null;


    const file =
      formData.get(
        "file"
      );


    console.log(
      "Form data received:",
      {
        type,
        side,
        fileName:
          file?.name,
        fileType:
          file?.type,
        fileSize:
          file?.size,
      }
    );


    const validation =
      validateDocumentUpload({
        type,
        side,
        file,
      });


    if (
      !validation.isValid
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Validation failed",

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
        type,
        side,
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
    } =
      await params;


    const { ownerId } =
  await getCurrentOwner();

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Owner ID is required",
        },
        {
          status: 400,
        }
      );
    }


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