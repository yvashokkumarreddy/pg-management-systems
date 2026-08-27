import { NextResponse } from "next/server";

import {
  createRoomService,
  getRoomsService,
} from "@/modules/rooms/room.service";

import {
  validateCreateRoom,
} from "@/modules/rooms/room.validation";


export async function POST(request) {
  try {
    const body = await request.json();

    const validation =
      validateCreateRoom(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const room =
      await createRoomService(body);

    return NextResponse.json(
      {
        success: true,
        message:
          "Room created successfully",
        data: room,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create room error:",
      error
    );

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
      { status }
    );
  }
}


export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const ownerId =
      searchParams.get("ownerId");

    const status =
      searchParams.get("status") ||
      "ACTIVE";

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Owner ID is required",
        },
        { status: 400 }
      );
    }

    const rooms =
      await getRoomsService(
        ownerId,
        status
      );

    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error(
      "Get rooms error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get rooms",
      },
      { status: 500 }
    );
  }
}