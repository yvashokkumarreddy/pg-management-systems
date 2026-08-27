import {
  and,
  asc,
  count,
  eq,
  inArray,
} from "drizzle-orm";

import { db } from "@/db";

import {
  rooms,
  tenants,
} from "@/db/schema";


export async function findRoomById(
  dbClient,
  roomId,
  ownerId
) {
  const result = await dbClient
    .select()
    .from(rooms)
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.ownerId, ownerId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}


export async function findRoomByNumber(
  dbClient,
  ownerId,
  roomNumber
) {
  const result = await dbClient
    .select()
    .from(rooms)
    .where(
      and(
        eq(rooms.ownerId, ownerId),
        eq(rooms.roomNumber, roomNumber)
      )
    )
    .limit(1);

  return result[0] ?? null;
}


export async function createRoom(
  dbClient,
  data
) {
  const result = await dbClient
    .insert(rooms)
    .values(data)
    .returning();

  return result[0];
}


export async function findRoomsByOwner(
  dbClient,
  ownerId,
  status = "ACTIVE"
) {
  return await dbClient
    .select()
    .from(rooms)
    .where(
      and(
        eq(rooms.ownerId, ownerId),
        eq(rooms.status, status)
      )
    )
    .orderBy(asc(rooms.roomNumber));
}


export async function countOccupiedBedsByRoom(
  dbClient,
  roomId
) {
  const result = await dbClient
    .select({
      count: count(),
    })
    .from(tenants)
    .where(
      and(
        eq(tenants.roomId, roomId),
        inArray(tenants.status, [
          "ACTIVE",
          "NOTICE_PERIOD",
        ])
      )
    );

  return result[0]?.count ?? 0;
}


export async function findCurrentTenantsByRoom(
  dbClient,
  roomId
) {
  return await dbClient
    .select({
      id: tenants.id,
      fullName: tenants.fullName,
      mobile: tenants.mobile,
      status: tenants.status,
      dateOfJoining: tenants.dateOfJoining,
      monthlyRent: tenants.monthlyRent,
    })
    .from(tenants)
    .where(
      and(
        eq(tenants.roomId, roomId),
        inArray(tenants.status, [
          "ACTIVE",
          "NOTICE_PERIOD",
        ])
      )
    );
}


export async function updateRoom(
  dbClient,
  roomId,
  ownerId,
  data
) {
  const result = await dbClient
    .update(rooms)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.ownerId, ownerId)
      )
    )
    .returning();

  return result[0] ?? null;
}


export async function archiveRoom(
  dbClient,
  roomId,
  ownerId
) {
  const result = await dbClient
    .update(rooms)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.ownerId, ownerId)
      )
    )
    .returning();

  return result[0] ?? null;
}