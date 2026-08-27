import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function successResponse(
  data = null,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.statusCode,
      }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong.",
      },
    },
    {
      status: 500,
    }
  );
}