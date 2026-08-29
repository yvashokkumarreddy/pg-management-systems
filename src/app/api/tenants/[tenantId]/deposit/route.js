import {
  NextResponse,
} from "next/server";

import {
  getTenantDepositService,
  updateTenantDepositService,
} from "@/modules/deposits/deposit.service";

import {
  validateUpdateDeposit,
} from "@/modules/deposits/deposit.validation";
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

    const deposit =
      await getTenantDepositService(
        tenantId,
        ownerId
      );

    return NextResponse.json(
      {
        success: true,
        data:
          deposit,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get deposit error:",
      error
    );

    const status =
      error.message ===
        "Tenant not found" ||
      error.message ===
        "Deposit not found"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get deposit",
      },
      {
        status,
      }
    );
  }
}


export async function PATCH(
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

    const body =
      await request.json();

    const validation =
      validateUpdateDeposit(
        body
      );

    if (
      !validation.isValid
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
           validation.errors.file ,
          errors:
            validation.errors,
        },
        {
          status: 400,
        }
      );
    }

    const deposit =
      await updateTenantDepositService(
        tenantId,
        ownerId,
        body
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Deposit updated successfully",
        data:
          deposit,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update deposit error:",
      error
    );

    const status =
      error.message ===
        "Tenant not found" ||
      error.message ===
        "Deposit not found"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update deposit",
      },
      {
        status,
      }
    );
  }
}