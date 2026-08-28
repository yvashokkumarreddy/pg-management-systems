import {
  and,
  asc,
  eq,
} from "drizzle-orm";

import {
  pgPhotos,
  pgProfiles,
  users,
} from "@/db/schema";


export async function findOwnerById(
  dbClient,
  ownerId
) {
  const result =
    await dbClient
      .select({
        id:
          users.id,

        status:
          users.status,
      })
      .from(users)
      .where(
        eq(
          users.id,
          ownerId
        )
      )
      .limit(1);

  return result[0] ?? null;
}


export async function findPgProfileByOwner(
  dbClient,
  ownerId
) {
  const result =
    await dbClient
      .select()
      .from(pgProfiles)
      .where(
        eq(
          pgProfiles.ownerId,
          ownerId
        )
      )
      .limit(1);

  return result[0] ?? null;
}


export async function createPgProfile(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        pgProfiles
      )
      .values(data)
      .returning();

  return result[0];
}


export async function updatePgProfile(
  dbClient,
  profileId,
  data
) {
  const result =
    await dbClient
      .update(
        pgProfiles
      )
      .set({
        ...data,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          pgProfiles.id,
          profileId
        )
      )
      .returning();

  return result[0] ?? null;
}


export async function findPhotosByProfile(
  dbClient,
  pgProfileId
) {
  return await dbClient
    .select({
      id:
        pgPhotos.id,

      pgProfileId:
        pgPhotos.pgProfileId,

      storagePath:
        pgPhotos.storagePath,

      sortOrder:
        pgPhotos.sortOrder,

      createdAt:
        pgPhotos.createdAt,

      updatedAt:
        pgPhotos.updatedAt,
    })
    .from(pgPhotos)
    .where(
      eq(
        pgPhotos.pgProfileId,
        pgProfileId
      )
    )
    .orderBy(
      asc(
        pgPhotos.sortOrder
      ),
      asc(
        pgPhotos.createdAt
      )
    );
}


export async function createPgPhoto(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        pgPhotos
      )
      .values(data)
      .returning();

  return result[0];
}


export async function findPgPhotoForOwner(
  dbClient,
  photoId,
  ownerId
) {
  const result =
    await dbClient
      .select({
        id:
          pgPhotos.id,

        pgProfileId:
          pgPhotos.pgProfileId,

        storagePath:
          pgPhotos.storagePath,

        sortOrder:
          pgPhotos.sortOrder,
      })
      .from(pgPhotos)
      .innerJoin(
        pgProfiles,
        eq(
          pgPhotos.pgProfileId,
          pgProfiles.id
        )
      )
      .where(
        and(
          eq(
            pgPhotos.id,
            photoId
          ),
          eq(
            pgProfiles.ownerId,
            ownerId
          )
        )
      )
      .limit(1);

  return result[0] ?? null;
}


export async function updatePgPhotoSortOrder(
  dbClient,
  photoId,
  sortOrder
) {
  const result =
    await dbClient
      .update(
        pgPhotos
      )
      .set({
        sortOrder,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          pgPhotos.id,
          photoId
        )
      )
      .returning();

  return result[0] ?? null;
}


export async function deletePgPhoto(
  dbClient,
  photoId
) {
  const result =
    await dbClient
      .delete(
        pgPhotos
      )
      .where(
        eq(
          pgPhotos.id,
          photoId
        )
      )
      .returning();

  return result[0] ?? null;
}