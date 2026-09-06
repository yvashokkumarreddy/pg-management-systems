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

import {
  getCurrentOwner,
} from "@/modules/auth/auth.service";


/* ======================================================
   POST /api/payments
====================================================== */

export async function POST(
  request
) {
  try {
    const {
      ownerId,
    } =
      await getCurrentOwner();


    const body =
      await request.json();


    /* ==================================================
       VALIDATION
    ================================================== */

    const validation =
      validateCreatePayment(
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
       CREATE PAYMENT
    ================================================== */

    const result =
      await createPaymentService({
        ...body,

        ownerId,

        /*
         * Normalize optional checkbox.
         *
         * Existing frontend requests that
         * don't send this field continue
         * behaving exactly as before.
         */
        markNoticePeriod:
          body.markNoticePeriod ===
          true,
      });


    return NextResponse.json(
      {
        success:
          true,

        message:
          result.notice
            ? "Payment recorded and tenant notice period started successfully"
            : "Payment recorded successfully",

        data:
          result,
      },
      {
        status:
          201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Create payment error:",
      error
    );


    let status =
      400;


    /* ==================================================
       AUTH
    ================================================== */

    if (
      error?.name ===
        "UnauthorizedError" ||
      error?.message ===
        "Unauthorized"
    ) {
      status =
        401;
    }

    /* ==================================================
       NOT FOUND
    ================================================== */

    else if (
      error?.message ===
        "Tenant not found" ||
      error?.message ===
        "Rent bill not found"
    ) {
      status =
        404;
    }

    /* ==================================================
       CONFLICT
    ================================================== */

    else if (
      error?.message ===
        "Rent bill is already fully paid" ||
      error?.message ===
        "One of the selected rent bills is already fully paid" ||
      error?.message ===
        "Tenant is already in notice period"
    ) {
      status =
        409;
    }


    return NextResponse.json(
      {
        success:
          false,

        message:
          error?.message ||
          "Failed to record payment",
      },
      {
        status,
      }
    );
  }
}


/* ======================================================
   GET /api/payments
====================================================== */

export async function GET() {
  try {
    const {
      ownerId,
    } =
      await getCurrentOwner();


    const payments =
      await getPaymentsService(
        ownerId
      );


    return NextResponse.json({
      success:
        true,

      data:
        payments,
    });
  } catch (
    error
  ) {
    console.error(
      "Get payments error:",
      error
    );


    const status =
      error?.name ===
        "UnauthorizedError" ||
      error?.message ===
        "Unauthorized"
        ? 401
        : 500;


    return NextResponse.json(
      {
        success:
          false,

        message:
          error?.message ||
          "Failed to get payments",
      },
      {
        status,
      }
    );
  }
}