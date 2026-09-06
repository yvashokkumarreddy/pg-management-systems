import { NextResponse } from "next/server";

import { getCurrentOwner } from "@/modules/auth/auth.service";
import { getCurrentRentPositionsService } from "@/modules/rent/rent.service";


export async function GET(request) {
  try {
    const {ownerId} =
      await getCurrentOwner();


    const { searchParams } =
      new URL(
        request.url
      );


    const status =
      searchParams.get(
        "status"
      );


    const allowedStatuses =
      [
        "PENDING",
        "PARTIAL",
        "PAID",
        "OVERDUE",
      ];


    if (
      status &&
      !allowedStatuses.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Invalid rent status",
        },
        {
          status:
            400,
        }
      );
    }


    const result =
      await getCurrentRentPositionsService(
        ownerId,
        status
      );


    return NextResponse.json(
      {
        success:
          true,

        data:
          result,
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "Get current rent positions error:",
      error
    );


    if (
      error?.name ===
      "UnauthorizedError"
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


    return NextResponse.json(
      {
        success:
          false,

        message:
          error.message ||
          "Failed to fetch current rent positions",
      },
      {
        status:
          500,
        }
      );
  }
}