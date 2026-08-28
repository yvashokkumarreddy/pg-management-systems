import {
  NextResponse,
} from "next/server";

import {
  getCurrentOwner,
  UnauthorizedError,
} from "@/modules/auth/auth.service";

import {
  getDashboardService,
} from "@/modules/dashboard/dashboard.service";


export async function GET() {
  try {
    const {
      ownerId,
    } =
      await getCurrentOwner();


    const dashboard =
      await getDashboardService(
        ownerId
      );


    return NextResponse.json({
      success: true,
      data:
        dashboard,
    });
  } catch (error) {
    if (
      error instanceof
      UnauthorizedError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 401,
        }
      );
    }


    console.error(
      "Dashboard error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load dashboard",
      },
      {
        status: 500,
      }
    );
  }
}