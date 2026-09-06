import {
  NextResponse,
} from "next/server";

import {
  getCurrentOwner,
} from "@/modules/auth/auth.service";

import {
  changeTenantRentCycleService,
} from "@/modules/tenants/tenant.service";

import {
  validateRentCycleChange,
} from "@/modules/tenants/tenant.validation";


export async function POST(
  request,
  {
    params,
  }
) {
  try {
    const {
      tenantId,
    } =
      await params;


    const {
      ownerId,
    } =
      await getCurrentOwner();

console.log("Owner ID: ashok", ownerId);
    if (
      !ownerId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Owner ID is required",
        },
        {
          status:
            401,
        }
      );
    }


    const body =
      await request.json();


    const validation =
      validateRentCycleChange(
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


    const result =
      await changeTenantRentCycleService(
        tenantId,
        ownerId,
        {
          rentCycleDay:
            Number(
              body.rentCycleDay
            ),

          transitionRentAmount:
            Number(
              body.transitionRentAmount
            ),
        }
      );


    return NextResponse.json(
      {
        success:
          true,

        message:
          "Rent cycle changed successfully",

        data:
          result,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Change rent cycle error:",
      error
    );


    let status =
      400;


    if (
      error.message ===
      "Tenant not found"
    ) {
      status =
        404;
    }


    return NextResponse.json(
      {
        success:
          false,

        message:
          error.message ||
          "Failed to change rent cycle",
      },
      {
        status,
      }
    );
  }
}