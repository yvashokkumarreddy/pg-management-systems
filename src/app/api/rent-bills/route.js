import { NextResponse } from "next/server";

import {
  getRentBillsService,
} from "@/modules/rent/rent.service";

import {
  validateRentStatusFilter,
} from "@/modules/rent/rent.validation";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function GET(request) {
  try {
     const { searchParams } =
      new URL(request.url);
    const { ownerId } =
  await getCurrentOwner();

    const status =
      searchParams.get("status");

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Owner ID is required",
        },
        { status: 400 }
      );
    }

    const validation =
      validateRentStatusFilter(status);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error,
        },
        { status: 400 }
      );
    }

    const result =
      await getRentBillsService(
        ownerId,
        status
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Get rent bills error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get rent bills",
      },
      { status: 500 }
    );
  }
}