import { NextResponse } from "next/server";

import { validateCreateTenant } from "@/modules/tenants/tenant.validation";
import {
  createTenantService,
  getTenantsService,
} from "@/modules/tenants/tenant.service";
export async function POST(request) {
  try {
    const body = await request.json();

    const validation =
      validateCreateTenant(body);

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

    const result =
      await createTenantService(body);

    return NextResponse.json(
      {
        success: true,
        message: "Tenant created successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create tenant error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to create tenant",
      },
      { status: 500 }
    );
  }
}
export async function GET(request) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const ownerId =
      searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Owner ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const tenants =
      await getTenantsService(ownerId);

    return NextResponse.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error(
      "Get tenants error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get tenants",
      },
      {
        status: 500,
      }
    );
  }
}