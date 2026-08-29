import {
  NextResponse,
} from "next/server";

import {
  deletePgPhotoService,
  updatePgPhotoService,
} from "@/modules/pg-profile/pg-profile.service";

import {
  validateSortOrder,
} from "@/modules/pg-profile/pg-profile.validation";
import { getCurrentOwner } from "@/modules/auth/auth.service";





export async function PATCH(
  request,
  { params }
) {
  try {
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


    const body =
      await request.json();


    const validation =
      validateSortOrder(
        body.sortOrder
      );


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


    const photo =
      await updatePgPhotoService(
        ownerId,
        photoId,
        validation.sortOrder
      );


    return NextResponse.json({
      success: true,

      message:
        "Photo order updated successfully",

      data:
        photo,
    });
  } catch (error) {
    console.error(
      "Update PG photo error:",
      error
    );


    const status =
      error.message ===
      "PG photo not found"
        ? 404
        : 400;


    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update PG photo",
      },
      {
        status,
      }
    );
  }
}


export async function DELETE(
  request,
  { params }
) {
  try {
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


    const result =
      await deletePgPhotoService(
        ownerId,
        photoId
      );


    return NextResponse.json({
      success: true,

      message:
        "PG photo deleted successfully",

      data:
        result,
    });
  } catch (error) {
    console.error(
      "Delete PG photo error:",
      error
    );


    const status =
      error.message ===
      "PG photo not found"
        ? 404
        : 500;


    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to delete PG photo",
      },
      {
        status,
      }
    );
  }
}