import {
  NextResponse,
} from "next/server";

import {
  processScheduledRentBillingService,
} from "@/modules/rent/rent.service";


function isAuthorizedCronRequest(
  request
) {
  const cronSecret =
    process.env.CRON_SECRET;


  if (
    !cronSecret
  ) {
    throw new Error(
      "CRON_SECRET is not configured"
    );
  }


  const authorization =
    request.headers.get(
      "authorization"
    );


  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}


/* ======================================================
   SCHEDULED RENT BILLING
====================================================== */

export async function GET(
  request
) {
  try {
    if (
      !isAuthorizedCronRequest(
        request
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Unauthorized",
        },
        {
          status:
            401,
        }
      );
    }


    const result =
      await processScheduledRentBillingService();


    return NextResponse.json(
      {
        success:
          true,

        message:
          "Scheduled rent billing completed",

        data:
          result,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Scheduled rent billing error:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          error.message ||
          "Scheduled rent billing failed",
      },
      {
        status:
          500,
      }
    );
  }
}