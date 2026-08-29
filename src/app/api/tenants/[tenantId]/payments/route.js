import {
  NextResponse,
} from "next/server";

import {
  getTenantPaymentsService,
} from "@/modules/payments/payment.service";

import {
  getCurrentOwner,
} from "@/modules/auth/auth.service";


export async function GET(
  request,
  { params }
) {
  try {
    const {
      tenantId,
    } = await params;


    const {
      ownerId,
    } = await getCurrentOwner();


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
        : error.message ===
            "Unauthorized"
          ? 401
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