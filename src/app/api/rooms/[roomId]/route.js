import { NextResponse } from "next/server";

import {
  archiveRoomService,
  getRoomByIdService,
  updateRoomService,
} from "@/modules/rooms/room.service";

import {
  validateUpdateRoom,
} from "@/modules/rooms/room.validation";
import { getCurrentOwner } from "@/modules/auth/auth.service";


export async function GET(
  request,
  { params }
) {
  try {
    const { roomId } = await params;

    const { ownerId } =
  await getCurrentOwner();

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

    const room =
      await getRoomByIdService(
        roomId,
        ownerId
      );

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          message: "Room not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error(
      "Get room error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to get room",
      },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request,
  { params }
) {
  try {
    const { roomId } = await params;

    const { ownerId } =
  await getCurrentOwner();

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

    const body = await request.json();

    const validation =
      validateUpdateRoom(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Validation failed",
          errors:
            validation.errors,
        },
        { status: 400 }
      );
    }

    const room =
      await updateRoomService(
        roomId,
        ownerId,
        body
      );

    return NextResponse.json({
      success: true,
      message:
        "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error(
      "Update room error:",
      error
    );

    let status = 500;

    if (
      error.message ===
      "Room not found"
    ) {
      status = 404;
    } else if (
      error.message ===
      "Room number already exists"
    ) {
      status = 409;
    } else if (
      error.message.includes(
        "Capacity cannot"
      ) ||
      error.message.includes(
        "Archived"
      )
    ) {
      status = 400;
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to update room",
      },
      { status }
    );
  }
}


export async function DELETE(
  request,
  { params }
) {
  try {
    const { roomId } = await params;

    const { ownerId } =
  await getCurrentOwner();

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

    const room =
      await archiveRoomService(
        roomId,
        ownerId
      );

    return NextResponse.json({
      success: true,
      message:
        "Room archived successfully",
      data: room,
    });
  } catch (error) {
    console.error(
      "Archive room error:",
      error
    );

    const status =
      error.message ===
      "Room not found"
        ? 404
        : 400;

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to archive room",
      },
      { status }
    );
  }
}