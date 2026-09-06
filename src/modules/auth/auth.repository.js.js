import {
  eq,
} from "drizzle-orm";

import {
  users,
} from "@/db/schema";


export async function findUserByAuthUserId(
  dbClient,
  authUserId
) {
  const result =
    await dbClient
      .select()
      .from(users)
      .where(
        eq(
          users.authUserId,
          authUserId
        )
      )
      .limit(1);

  return result[0] ?? null;
}


export async function findUserByEmail(
  dbClient,
  email
) {
  const result =
    await dbClient
      .select()
      .from(users)
      .where(
        eq(
          users.email,
          email
        )
      )
      .limit(1);

  return result[0] ?? null;
}


export async function linkAuthUser(
  dbClient,
  userId,
  authUserId
) {
  const result =
    await dbClient
      .update(users)
      .set({
        authUserId,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          users.id,
          userId
        )
      )
      .returning();

  return result[0] ?? null;
}