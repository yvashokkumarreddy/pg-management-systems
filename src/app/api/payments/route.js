import {
  NextResponse,
} from "next/server";

import {
  createPaymentService,
  getPaymentsService,
} from "@/modules/payments/payment.service";

import {
  validateCreatePayment,
} from "@/modules/payments/payment.validation";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function POST(
  request
) {
  try {
    const body =
      await request.json();
    const { ownerId } =
  await getCurrentOwner();

    const validation =
      validateCreatePayment(
        body
      );

    if (!validation.isValid) {
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
      await createPaymentService({
        ownerId,
        ...body
      }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment recorded successfully",
        data: result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    let status = 400;

    if (
      error.message ===
      "Tenant not found" ||
      error.message ===
      "Rent bill not found"
    ) {
      status = 404;
    }

    if (
      error.message ===
      "Rent bill is already fully paid"
    ) {
      status = 409;
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to record payment",
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

    const payments =
      await getPaymentsService(
        ownerId
      );

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error(
      "Get payments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get payments",
      },
      {
        status: 500,
      }
    );
  }
}