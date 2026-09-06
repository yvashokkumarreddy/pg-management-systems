import {
  NextResponse,
} from "next/server";

import {
  getTenantByIdService,
  updateTenantService,
  archiveTenantService,
  restoreTenantService,
} from "@/modules/tenants/tenant.service";

import {
  validateUpdateTenant,
} from "@/modules/tenants/tenant.validation";

import {
  getCurrentOwner,
  UnauthorizedError,
} from "@/modules/auth/auth.service";


/* ======================================================
   GET TENANT
====================================================== */

export async function GET(
  request,
  { params }
) {
  try {
    const { tenantId } =
      await params;

    const { ownerId } =
      await getCurrentOwner();


    const tenant =
      await getTenantByIdService(
        tenantId,
        ownerId
      );


    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tenant not found",
        },
        {
          status: 404,
        }
      );
    }


    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error(
      "Get tenant error:",
      error
    );


    if (
      error instanceof
      UnauthorizedError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 401,
        }
      );
    }


    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to get tenant",
      },
      {
        status: 500,
      }
    );
  }
}


/* ======================================================
   PATCH TENANT
====================================================== */

export async function PATCH(
  request,
  { params }
) {
  try {
    const { tenantId } =
      await params;

    const { ownerId } =
      await getCurrentOwner();

    const body =
      await request.json();


    /* ==================================================
       RESTORE ARCHIVED TENANT
    ================================================== */

    if (
      body.status ===
        "ACTIVE" &&
      Object.keys(body).length ===
        1
    ) {
      const tenant =
        await restoreTenantService(
          tenantId,
          ownerId
        );


      return NextResponse.json({
        success: true,

        message:
          "Tenant activated successfully",

        data: tenant,
      });
    }


    /* ==================================================
       NORMAL UPDATE
    ================================================== */

    const validation =
      validateUpdateTenant(
        body
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


    const result =
      await updateTenantService(
        tenantId,
        ownerId,
        body
      );


    return NextResponse.json({
      success: true,

      message:
        "Tenant updated successfully",

      data: result,
    });
  } catch (error) {
    console.error(
      "Update tenant error:",
      error
    );


    if (
      error instanceof
      UnauthorizedError
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            error.message,
        },
        {
          status: 401,
        }
      );
    }


    const knownBadRequestMessages =
      [
        "Archived tenant cannot be updated",
        "Only archived tenants can be activated",
        "Room not found",
        "Assigned room not found",
        "Assigned room is archived",
        "Room does not belong to this owner",
        "Room has no available bed",
        "Assigned room has no available bed",
        "Tenant has no assigned room",
        "Cannot assign tenant to an archived room",
      ];


    const status =
      error.message ===
      "Tenant not found"
        ? 404
        : knownBadRequestMessages.includes(
              error.message
            )
          ? 400
          : 500;


    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to update tenant",
      },
      {
        status,
      }
    );
  }
}


/* ======================================================
   ARCHIVE TENANT
====================================================== */

export async function DELETE(
  request,
  { params }
) {
  try {
    const { tenantId } =
      await params;

    const { ownerId } =
      await getCurrentOwner();


    let body = {};


    try {
      body =
        await request.json();
    } catch {
      /*
       * Leaving date is optional.
       */
    }


    const tenant =
      await archiveTenantService(
        tenantId,
        ownerId,
        body.dateOfLeaving
      );


    return NextResponse.json({
      success: true,

      message:
        "Tenant archived successfully",

      data: tenant,
    });
  } catch (error) {
    console.error(
      "Archive tenant error:",
      error
    );


    if (
      error instanceof
      UnauthorizedError
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            error.message,
        },
        {
          status: 401,
        }
      );
    }


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
          "Failed to archive tenant",
      },
      {
        status,
      }
    );
  }
}