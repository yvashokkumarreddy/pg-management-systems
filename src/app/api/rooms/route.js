import { NextResponse } from "next/server";

import {
  createRoomService,
  getRoomsService,
} from "@/modules/rooms/room.service";

import {
  validateCreateRoom,
} from "@/modules/rooms/room.validation";

import {
  getCurrentOwner,
  UnauthorizedError,
} from "@/modules/auth/auth.service";


/* ======================================================
   POST /api/rooms
   Create Room
====================================================== */

export async function POST(request) {
  try {
    const { ownerId } =
      await getCurrentOwner();

    const body =
      await request.json();

    const validation =
      validateCreateRoom(body);

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

    const room =
      await createRoomService({
        ownerId,
        ...body,
      });

    console.log(
      "Room created:",
      room
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Room created successfully",
        data: room,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create room error:",
      error
    );

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

    let status = 500;

    if (
      error.message ===
      "Room number already exists"
    ) {
      status = 409;
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to create room",
      },
      {
        status,
      }
    );
  }
}


/* ======================================================
   GET /api/rooms

   Default:
   GET /api/rooms
   -> Active rooms only

   Include archived:
   GET /api/rooms?includeArchived=true
   -> Active + Archived rooms
====================================================== */

export async function GET(request) {
  try {
    const { ownerId } =
      await getCurrentOwner();

    const { searchParams } =
      new URL(request.url);

    const includeArchived =
      searchParams.get(
        "includeArchived"
      ) === "true";

    console.log(
      "GET ROOMS ownerId:",
      ownerId
    );

    console.log(
      "GET ROOMS includeArchived:",
      includeArchived
    );

    /*
     * IMPORTANT:
     *
     * ownerId remains the first argument.
     * includeArchived is only an optional
     * configuration value.
     */
    const rooms =
      await getRoomsService(
        ownerId,
        {
          includeArchived,
        }
      );

    console.log(
      "GET ROOMS result count:",
      rooms?.length || 0
    );

    return NextResponse.json({
      success: true,
      data: rooms || [],
    });
  } catch (error) {
    console.error(
      "Get rooms error:",
      error
    );

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

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to fetch rooms",
      },
      {
        status: 500,
      }
    );
  }
}