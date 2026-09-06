import {
  NextResponse,
} from "next/server";

import {
  getRentBillByIdService,
} from "@/modules/rent/rent.service";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function GET(
  request,
  { params }
) {
  try {
    const {
      billId,
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

    const bill =
      await getRentBillByIdService(
        billId,
        ownerId
      );

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rent bill not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error(
      "Get rent bill error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get rent bill",
      },
      {
        status: 500,
      }
    );
  }
}