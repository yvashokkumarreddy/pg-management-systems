import {
  NextResponse,
} from "next/server";

import {
  uploadPgPhotoService,
} from "@/modules/pg-profile/pg-profile.service";

import {
  validatePgPhoto,
} from "@/modules/pg-profile/pg-profile.validation";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function POST(
  request
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


    const formData =
      await request.formData();


    const file =
      formData.get(
        "file"
      );


    const validation =
      validatePgPhoto(
        file
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
      await uploadPgPhotoService(
        ownerId,
        file
      );


    return NextResponse.json(
      {
        success: true,

        message:
          "PG photo uploaded successfully",

        data:
          photo,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Upload PG photo error:",
      error
    );


    const status =
      error.message ===
      "PG profile not found"
        ? 404
        : 400;


    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to upload PG photo",
      },
      {
        status,
      }
    );
  }
}