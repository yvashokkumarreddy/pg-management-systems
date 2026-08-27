import "dotenv/config";
import { db } from "../src/db/index.js";
import { users, rooms } from "../src/db/schema/index.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

async function seed() {
  const ownerPhone = "9999999999";
  const roomNumber = "101";

  let owner = (
    await db
      .select()
      .from(users)
      .where(eq(users.phone, ownerPhone))
      .limit(1)
  )[0];

  if (!owner) {
    [owner] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: "Development Owner",
        phone: ownerPhone,
        email: "owner@example.com",
        status: "ACTIVE",
      })
      .returning();

    console.log("Owner created:", owner.id);
  } else {
    console.log("Owner already exists:", owner.id);
  }

  let room = (
    await db
      .select()
      .from(rooms)
      .where(
        and(
          eq(rooms.ownerId, owner.id),
          eq(rooms.roomNumber, roomNumber)
        )
      )
      .limit(1)
  )[0];

  if (!room) {
    [room] = await db
      .insert(rooms)
      .values({
        id: crypto.randomUUID(),
        ownerId: owner.id,
        roomNumber,
        floor: "1",
        capacity: 3,
        rentPerBed: "12000",
        notes: "Development test room",
        status: "ACTIVE",
      })
      .returning();

    console.log("Room created:", room.id);
  } else {
    console.log("Room already exists:", room.id);
  }

  console.log("\nUse these values for tenant API testing:");
  console.log("ownerId:", owner.id);
  console.log("roomId:", room.id);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});