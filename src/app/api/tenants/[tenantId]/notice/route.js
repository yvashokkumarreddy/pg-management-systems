import {
  NextResponse,
} from "next/server";

import {
  getCurrentOwner,
} from "@/modules/auth/auth.service.js";

import {
  giveTenantNoticeService,
  cancelTenantNoticeService,
} from "@/modules/tenants/tenant.service.js";

import {
  validateGiveNotice,
} from "@/modules/tenants/tenant.validation.js";


/* ======================================================
   GIVE TENANT VACATING NOTICE
====================================================== */

export async function POST(
  request,
  { params }
) {
  try {
    /*
     * getCurrentOwner() returns:
     *
     * {
     *   ownerId,
     *   authUserId,
     *   email,
     *   user
     * }
     *
     * Therefore use auth.ownerId.
     */
    const auth =
      await getCurrentOwner();


    const {
      tenantId,
    } =
      await params;


    const body =
      await request.json();


    /* ==================================================
       VALIDATE REQUEST
    ================================================== */

    const validation =
      validateGiveNotice(
        body
      );


    if (
      !validation.isValid
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Validation failed",

          errors:
            validation.errors,
        },
        {
          status:
            400,
        }
      );
    }


    /* ==================================================
       START NOTICE PERIOD
    ================================================== */

    const result =
      await giveTenantNoticeService(
        tenantId,
        auth.ownerId,
        body
      );


    return NextResponse.json(
      {
        success:
          true,

        message:
          "Tenant notice period started successfully",

        data:
          result,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Give tenant notice error:",
      error
    );


    /* ==================================================
       AUTH ERROR
    ================================================== */

    if (
      error?.name ===
      "UnauthorizedError"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unauthorized",
        },
        {
          status:
            401,
        }
      );
    }


    /* ==================================================
       BUSINESS / VALIDATION ERROR
    ================================================== */

    return NextResponse.json(
      {
        success:
          false,

        message:
          error?.message ||
          "Failed to start tenant notice period",
      },
      {
        status:
          400,
      }
    );
  }
}


/* ======================================================
   CANCEL TENANT VACATING NOTICE
====================================================== */

export async function DELETE(
  request,
  { params }
) {
  try {
    const auth =
      await getCurrentOwner();


    const {
      tenantId,
    } =
      await params;


    /* ==================================================
       CANCEL NOTICE PERIOD
    ================================================== */

    const result =
      await cancelTenantNoticeService(
        tenantId,
        auth.ownerId
      );


    return NextResponse.json(
      {
        success:
          true,

        message:
          "Tenant notice period cancelled successfully",

        data:
          result,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Cancel tenant notice error:",
      error
    );


    /* ==================================================
       AUTH ERROR
    ================================================== */

    if (
      error?.name ===
      "UnauthorizedError"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unauthorized",
        },
        {
          status:
            401,
        }
      );
    }


    /* ==================================================
       BUSINESS ERROR
    ================================================== */

    return NextResponse.json(
      {
        success:
          false,

        message:
          error?.message ||
          "Failed to cancel tenant notice period",
      },
      {
        status:
          400,
      }
    );
  }
}