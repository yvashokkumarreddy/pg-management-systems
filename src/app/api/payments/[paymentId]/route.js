import {
  NextResponse,
} from "next/server";

import {
  getPaymentByIdService,
} from "@/modules/payments/payment.service";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function GET(
  request,
  { params }
) {
  try {
    const {
      paymentId,
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

    const payment =
      await getPaymentByIdService(
        paymentId,
        ownerId
      );

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error(
      "Get payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get payment",
      },
      {
        status: 500,
      }
    );
  }
}