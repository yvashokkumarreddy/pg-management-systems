import {
  NextResponse,
} from "next/server";

import {
  getTenantPaymentsService,
} from "@/modules/payments/payment.service";
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

    const payments =
      await getTenantPaymentsService(
        tenantId,
        ownerId
      );

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error(
      "Get tenant payments error:",
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
          "Failed to get tenant payments",
      },
      {
        status,
      }
    );
  }
}