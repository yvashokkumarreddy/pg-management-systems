import {
  NextResponse,
} from "next/server";

import {
  getCurrentOwner,
  UnauthorizedError,
} from "@/modules/auth/auth.service";


export async function GET() {
  try {
    const {
      user,
      email,
    } =
      await getCurrentOwner();


    return NextResponse.json({
      success: true,

      data: {
        id:
          user.id,

        email,

        status:
          user.status,

        createdAt:
          user.createdAt,
      },
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
      "Get current owner error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to get current owner",
      },
      {
        status: 500,
      }
    );
  }
}