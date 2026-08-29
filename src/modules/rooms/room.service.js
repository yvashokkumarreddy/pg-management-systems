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
  const normalizedCapacity =
    Number(capacity || 0);

  const normalizedOccupiedBeds =
    Number(occupiedBeds || 0);

  const vacantBeds = Math.max(
    normalizedCapacity -
      normalizedOccupiedBeds,
    0
  );

  let occupancyStatus = "VACANT";

  if (normalizedOccupiedBeds === 0) {
    occupancyStatus = "VACANT";
  } else if (
    normalizedOccupiedBeds <
    normalizedCapacity
  ) {
    occupancyStatus =
      "PARTIALLY_FILLED";
  } else {
    occupancyStatus = "FULL";
  }

  return {
    occupiedBeds:
      normalizedOccupiedBeds,

    vacantBeds,

    occupancyStatus,
  };
}

export async function createRoomService(
  data
) {
  if (!data.ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

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

  const room = await createRoom(
    db,
    {
      id: crypto.randomUUID(),

      ownerId: data.ownerId,

      roomNumber:
        data.roomNumber.trim(),

      floor:
        data.floor?.trim() ||
        null,

      capacity:
        Number(data.capacity),

      rentPerBed:
        String(data.rentPerBed),

      notes:
        data.notes?.trim() ||
        null,

      status: "ACTIVE",
    }
  );

  return {
    ...room,

    ...calculateOccupancy(
      room.capacity,
      0
    ),
  };
}

export async function getRoomsService(
  ownerId,
  {
    includeArchived = false,
  } = {}
) {
  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  /*
   * Your existing repository already accepts:
   *
   * findRoomsByOwner(
   *   db,
   *   ownerId,
   *   status
   * )
   *
   * So we do not need to modify the repository.
   */

  const activeRooms =
    await findRoomsByOwner(
      db,
      ownerId,
      "ACTIVE"
    );

  let roomList = activeRooms;

  /*
   * Only query archived rooms when
   * includeArchived=true.
   */
  if (includeArchived) {
    const archivedRooms =
      await findRoomsByOwner(
        db,
        ownerId,
        "ARCHIVED"
      );

    roomList = [
      ...activeRooms,
      ...archivedRooms,
    ];
  }

  /*
   * Calculate occupancy for each room.
   *
   * Archived rooms cannot have current
   * tenants because you prevent occupied
   * rooms from being archived.
   */
  const result =
    await Promise.all(
      roomList.map(
        async (room) => {
          let occupiedBeds = 0;

          if (
            room.status ===
            "ACTIVE"
          ) {
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
        }
      )
    );

  return result;
}

export async function getRoomByIdService(
  roomId,
  ownerId
) {
  if (!roomId) {
    throw new Error(
      "Room ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const room =
    await findRoomById(
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

    tenants:
      currentTenants,
  };
}

export async function updateRoomService(
  roomId,
  ownerId,
  data
) {
  if (!roomId) {
    throw new Error(
      "Room ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const existingRoom =
    await findRoomById(
      db,
      roomId,
      ownerId
    );

  if (!existingRoom) {
    throw new Error(
      "Room not found"
    );
  }

  if (
    existingRoom.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Archived room cannot be updated"
    );
  }

  if (
    data.roomNumber !== undefined &&
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
      duplicateRoom.id !==
        roomId
    ) {
      throw new Error(
        "Room number already exists"
      );
    }
  }

  if (
    data.capacity !== undefined
  ) {
    const occupiedBeds =
      await countOccupiedBedsByRoom(
        db,
        roomId
      );

    const newCapacity =
      Number(data.capacity);

    if (
      newCapacity <
      occupiedBeds
    ) {
      throw new Error(
        `Room currently has ${occupiedBeds} occupied beds. Capacity cannot be reduced below ${occupiedBeds}.`
      );
    }
  }

  const updates = {};

  if (
    data.roomNumber !== undefined
  ) {
    updates.roomNumber =
      data.roomNumber.trim();
  }

  if (
    data.floor !== undefined
  ) {
    updates.floor =
      data.floor?.trim() ||
      null;
  }

  if (
    data.capacity !== undefined
  ) {
    updates.capacity =
      Number(data.capacity);
  }

  if (
    data.rentPerBed !== undefined
  ) {
    updates.rentPerBed =
      String(data.rentPerBed);
  }

  if (
    data.notes !== undefined
  ) {
    updates.notes =
      data.notes?.trim() ||
      null;
  }

  if (
    Object.keys(updates)
      .length === 0
  ) {
    return await getRoomByIdService(
      roomId,
      ownerId
    );
  }

  const room =
    await updateRoom(
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
    throw new Error(
      "Room ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const room =
    await findRoomById(
      db,
      roomId,
      ownerId
    );

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  if (
    room.status ===
    "ARCHIVED"
  ) {
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

  const archivedRoom =
    await archiveRoom(
      db,
      roomId,
      ownerId
    );

  return {
    ...archivedRoom,

    ...calculateOccupancy(
      archivedRoom.capacity,
      0
    ),
  };
}

export async function restoreRoomService(
  roomId,
  ownerId
) {
  if (!roomId) {
    throw new Error(
      "Room ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const room =
    await findRoomById(
      db,
      roomId,
      ownerId
    );

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  if (
    room.status !==
    "ARCHIVED"
  ) {
    throw new Error(
      "Only archived rooms can be restored"
    );
  }

  const duplicateRoom =
    await findRoomByNumber(
      db,
      ownerId,
      room.roomNumber
    );

  if (
    duplicateRoom &&
    duplicateRoom.id !==
      roomId &&
    duplicateRoom.status ===
      "ACTIVE"
  ) {
    throw new Error(
      "An active room with this room number already exists"
    );
  }

  const restoredRoom =
    await updateRoom(
      db,
      roomId,
      ownerId,
      {
        status: "ACTIVE",
      }
    );

  return {
    ...restoredRoom,

    ...calculateOccupancy(
      restoredRoom.capacity,
      0
    ),
  };
}