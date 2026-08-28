import { NextResponse } from "next/server";

import {
  getTenantByIdService,
  updateTenantService,
  archiveTenantService,
} from "@/modules/tenants/tenant.service";

import {
  validateUpdateTenant,
} from "@/modules/tenants/tenant.validation";
import { getCurrentOwner } from "@/modules/auth/auth.service";

export async function GET(request, { params }) {
  try {
    const { tenantId } = await params;
    console.log("Tenant ID:", tenantId);
    const { ownerId } =
  await getCurrentOwner();

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Owner ID is required",
        },
        { status: 400 }
      );
    }

    const tenant = await getTenantByIdService(
      tenantId,
      ownerId
    );

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          message: "Tenant not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Get tenant error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get tenant",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { tenantId } = await params;

    const { ownerId } =
  await getCurrentOwner();

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Owner ID is required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validation =
      validateUpdateTenant(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const result = await updateTenantService(
      tenantId,
      ownerId,
      body
    );

    return NextResponse.json({
      success: true,
      message: "Tenant updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update tenant error:", error);

    const status =
      error.message === "Tenant not found"
        ? 404
        : error.message.includes("Room") ||
          error.message.includes("Archived")
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update tenant",
      },
      { status }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { tenantId } = await params;

    const { ownerId } =
  await getCurrentOwner();

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Owner ID is required",
        },
        { status: 400 }
      );
    }

    let body = {};

    try {
      body = await request.json();
    } catch {
      // Leaving date is optional.
    }

    const tenant = await archiveTenantService(
      tenantId,
      ownerId,
      body.dateOfLeaving
    );

    return NextResponse.json({
      success: true,
      message: "Tenant archived successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Archive tenant error:", error);

    const status =
      error.message === "Tenant not found"
        ? 404
        : 400;

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to archive tenant",
      },
      { status }
    );
  }
}