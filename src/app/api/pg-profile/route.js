import {
  NextResponse,
} from "next/server";

import {
  createPgProfileService,
  getPgProfileService,
  updatePgProfileService,
} from "@/modules/pg-profile/pg-profile.service";

import {
  validateCreatePgProfile,
  validateUpdatePgProfile,
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


    const body =
      await request.json();


    const validation =
      validateCreatePgProfile(
        body
      );


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


    const profile =
      await createPgProfileService(
        ownerId,
        body
      );


    return NextResponse.json(
      {
        success: true,

        message:
          "PG profile created successfully",

        data:
          profile,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create PG profile error:",
      error
    );


    let status =
      400;


    if (
      error.message ===
      "Owner not found"
    ) {
      status =
        404;
    }


    if (
      error.message ===
      "PG profile already exists"
    ) {
      status =
        409;
    }


    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to create PG profile",
      },
      {
        status,
      }
    );
  }
}


export async function GET(
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


    const profile =
      await getPgProfileService(
        ownerId
      );


    return NextResponse.json({
      success: true,
      data:
        profile,
    });
  } catch (error) {
    console.error(
      "Get PG profile error:",
      error
    );


    const status =
      error.message ===
      "PG profile not found"
        ? 404
        : 500;


    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get PG profile",
      },
      {
        status,
      }
    );
  }
}


export async function PATCH(
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


    const body =
      await request.json();


    const validation =
      validateUpdatePgProfile(
        body
      );


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


    const profile =
      await updatePgProfileService(
        ownerId,
        body
      );


    return NextResponse.json({
      success: true,

      message:
        "PG profile updated successfully",

      data:
        profile,
    });
  } catch (error) {
    console.error(
      "Update PG profile error:",
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
          "Failed to update PG profile",
      },
      {
        status,
      }
    );
  }
}