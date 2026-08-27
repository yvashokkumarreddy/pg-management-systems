import crypto from "crypto";

import { db } from "@/db";

import {
  archiveRoom,
  countOccupiedBedsByRoom,
  createRoom,
  findCurrentTenantsByRoom,
  findRoomById,
  findRoomByNumber,
  findRoomsByOwner,
  updateRoom,
} from "./room.repository.js";


function calculateOccupancy(
  capacity,
  occupiedBeds
) {
  const vacantBeds = Math.max(
    Number(capacity) - Number(occupiedBeds),
    0
  );

  let occupancyStatus = "VACANT";

  if (occupiedBeds === 0) {
    occupancyStatus = "VACANT";
  } else if (occupiedBeds < capacity) {
    occupancyStatus = "PARTIALLY_FILLED";
  } else {
    occupancyStatus = "FULL";
  }

  return {
    occupiedBeds,
    vacantBeds,
    occupancyStatus,
  };
}


export async function createRoomService(data) {
  const existingRoom =
    await findRoomByNumber(
      db,
      data.ownerId,
      data.roomNumber.trim()
    );

  if (existingRoom) {
    throw new Error(
      "Room number already exists"
    );
  }

  const room = await createRoom(db, {
    id: crypto.randomUUID(),

    ownerId: data.ownerId,

    roomNumber:
      data.roomNumber.trim(),

    floor:
      data.floor?.trim() || null,

    capacity:
      Number(data.capacity),

    rentPerBed:
      String(data.rentPerBed),

    notes:
      data.notes?.trim() || null,

    status: "ACTIVE",
  });

  return {
    ...room,
    occupiedBeds: 0,
    vacantBeds: room.capacity,
    occupancyStatus: "VACANT",
  };
}


export async function getRoomsService(
  ownerId,
  status = "ACTIVE"
) {
  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  const validStatus = [
    "ACTIVE",
    "ARCHIVED",
  ].includes(status)
    ? status
    : "ACTIVE";

  const roomList =
    await findRoomsByOwner(
      db,
      ownerId,
      validStatus
    );

  const result = await Promise.all(
    roomList.map(async (room) => {
      let occupiedBeds = 0;

      if (room.status === "ACTIVE") {
        occupiedBeds =
          await countOccupiedBedsByRoom(
            db,
            room.id
          );
      }

      return {
        ...room,
        ...calculateOccupancy(
          room.capacity,
          occupiedBeds
        ),
      };
    })
  );

  return result;
}


export async function getRoomByIdService(
  roomId,
  ownerId
) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  const room = await findRoomById(
    db,
    roomId,
    ownerId
  );

  if (!room) {
    return null;
  }

  const occupiedBeds =
    room.status === "ACTIVE"
      ? await countOccupiedBedsByRoom(
          db,
          room.id
        )
      : 0;

  const currentTenants =
    room.status === "ACTIVE"
      ? await findCurrentTenantsByRoom(
          db,
          room.id
        )
      : [];

  return {
    ...room,

    ...calculateOccupancy(
      room.capacity,
      occupiedBeds
    ),

    tenants: currentTenants,
  };
}


export async function updateRoomService(
  roomId,
  ownerId,
  data
) {
  const existingRoom =
    await findRoomById(
      db,
      roomId,
      ownerId
    );

  if (!existingRoom) {
    throw new Error("Room not found");
  }

  if (existingRoom.status === "ARCHIVED") {
    throw new Error(
      "Archived room cannot be updated"
    );
  }

  if (
    data.roomNumber &&
    data.roomNumber.trim() !==
      existingRoom.roomNumber
  ) {
    const duplicateRoom =
      await findRoomByNumber(
        db,
        ownerId,
        data.roomNumber.trim()
      );

    if (
      duplicateRoom &&
      duplicateRoom.id !== roomId
    ) {
      throw new Error(
        "Room number already exists"
      );
    }
  }

  if (data.capacity !== undefined) {
    const occupiedBeds =
      await countOccupiedBedsByRoom(
        db,
        roomId
      );

    const newCapacity =
      Number(data.capacity);

    if (newCapacity < occupiedBeds) {
      throw new Error(
        `Room currently has ${occupiedBeds} occupied beds. Capacity cannot be reduced below ${occupiedBeds}.`
      );
    }
  }

  const updates = {};

  if (data.roomNumber !== undefined) {
    updates.roomNumber =
      data.roomNumber.trim();
  }

  if (data.floor !== undefined) {
    updates.floor =
      data.floor?.trim() || null;
  }

  if (data.capacity !== undefined) {
    updates.capacity =
      Number(data.capacity);
  }

  if (data.rentPerBed !== undefined) {
    updates.rentPerBed =
      String(data.rentPerBed);
  }

  if (data.notes !== undefined) {
    updates.notes =
      data.notes?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return await getRoomByIdService(
      roomId,
      ownerId
    );
  }

  const room = await updateRoom(
    db,
    roomId,
    ownerId,
    updates
  );

  const occupiedBeds =
    await countOccupiedBedsByRoom(
      db,
      roomId
    );

  return {
    ...room,

    ...calculateOccupancy(
      room.capacity,
      occupiedBeds
    ),
  };
}


export async function archiveRoomService(
  roomId,
  ownerId
) {
  if (!roomId) {
    throw new Error("Room ID is required");
  }

  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  const room =
    await findRoomById(
      db,
      roomId,
      ownerId
    );

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.status === "ARCHIVED") {
    throw new Error(
      "Room is already archived"
    );
  }

  const occupiedBeds =
    await countOccupiedBedsByRoom(
      db,
      roomId
    );

  if (occupiedBeds > 0) {
    throw new Error(
      "Room cannot be archived while tenants are occupying it"
    );
  }

  return await archiveRoom(
    db,
    roomId,
    ownerId
  );
}