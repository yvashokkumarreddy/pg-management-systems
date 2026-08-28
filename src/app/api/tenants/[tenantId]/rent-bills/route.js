import {
  NextResponse,
} from "next/server";

import {
  generateNextRentBillService,
  getTenantRentBillsService,
} from "@/modules/rent/rent.service";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function GET(
  request,
  { params }
) {
  try {
    const {
      tenantId,
    } = await params;

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

    const bills =
      await getTenantRentBillsService(
        tenantId,
        ownerId
      );

    return NextResponse.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    console.error(
      "Get tenant rent bills error:",
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
          "Failed to get tenant rent bills",
      },
      {
        status,
      }
    );
  }
}


export async function POST(
  request,
  { params }
) {
  try {
    const {
      tenantId,
    } = await params;

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

    const bill =
      await generateNextRentBillService(
        tenantId,
        ownerId
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Rent bill generated successfully",
        data: bill,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Generate rent bill error:",
      error
    );

    let status = 400;

    if (
      error.message ===
      "Tenant not found"
    ) {
      status = 404;
    }

    if (
      error.message ===
      "Rent bill already exists for this billing cycle"
    ) {
      status = 409;
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to generate rent bill",
      },
      {
        status,
      }
    );
  }
}