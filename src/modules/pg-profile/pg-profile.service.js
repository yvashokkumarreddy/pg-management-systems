import crypto from "crypto";

import { db } from "@/db";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";

import {
  createPgPhoto,
  createPgProfile,
  deletePgPhoto,
  findOwnerById,
  findPgPhotoForOwner,
  findPgProfileByOwner,
  findPhotosByProfile,
  updatePgPhotoSortOrder,
  updatePgProfile,
} from "./pg-profile.repository.js";


const BUCKET_NAME =
  "pg-photos";


const SIGNED_URL_EXPIRY_SECONDS =
  60 * 10;


const MAX_PHOTOS =
  10;


function createSlug(
  pgName
) {
  const name =
    pgName
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  const suffix =
    crypto
      .randomBytes(3)
      .toString("hex");

  return `${name}-${suffix}`;
}


function sanitizeFileName(
  name
) {
  return name
    .trim()
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    )
    .toLowerCase();
}


function getPhotoContentType(
  file
) {
  if (
    file.type &&
    file.type !==
      "application/octet-stream"
  ) {
    return file.type;
  }


  const extension =
    file.name
      ?.split(".")
      .pop()
      ?.toLowerCase();


  if (
    extension === "jpg" ||
    extension === "jpeg"
  ) {
    return "image/jpeg";
  }


  if (
    extension === "png"
  ) {
    return "image/png";
  }


  if (
    extension === "webp"
  ) {
    return "image/webp";
  }


  return "application/octet-stream";
}


async function createPhotoSignedUrl(
  storagePath
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin.storage
      .from(
        BUCKET_NAME
      )
      .createSignedUrl(
        storagePath,
        SIGNED_URL_EXPIRY_SECONDS
      );


  if (error) {
    console.error(
      "PG photo signed URL error:",
      error
    );

    return null;
  }


  return data?.signedUrl ?? null;
}


async function formatProfile(
  profile
) {
  const photos =
    await findPhotosByProfile(
      db,
      profile.id
    );


  const formattedPhotos =
    await Promise.all(
      photos.map(
        async (photo) => ({
          id:
            photo.id,

          sortOrder:
            photo.sortOrder,

          fileUrl:
            await createPhotoSignedUrl(
              photo.storagePath
            ),

          createdAt:
            photo.createdAt,
        })
      )
    );


  return {
    id:
      profile.id,

    ownerId:
      profile.ownerId,

    slug:
      profile.slug,

    pgName:
      profile.pgName,

    description:
      profile.description ??
      "",

    address:
      profile.address ??
      "",

    contactNumber:
      profile.contactNumber ??
      "",

    googleMapsUrl:
      profile.googleMapsUrl ??
      "",

    amenities:
      profile.amenities ??
      [],

    roomTypes:
      profile.roomTypes ??
      [],

    isPublished:
      Boolean(
        profile.isPublished
      ),

    photos:
      formattedPhotos,

    createdAt:
      profile.createdAt,

    updatedAt:
      profile.updatedAt,
  };
}


export async function createPgProfileService(
  ownerId,
  data
) {
  const owner =
    await findOwnerById(
      db,
      ownerId
    );


  if (!owner) {
    throw new Error(
      "Owner not found"
    );
  }


  const existing =
    await findPgProfileByOwner(
      db,
      ownerId
    );


  if (existing) {
    throw new Error(
      "PG profile already exists"
    );
  }


  const profile =
    await createPgProfile(
      db,
      {
        id:
          crypto.randomUUID(),

        ownerId,

        slug:
          createSlug(
            data.pgName
          ),

        pgName:
          data.pgName.trim(),

        description:
          data.description?.trim() ||
          null,

        address:
          data.address?.trim() ||
          null,

        contactNumber:
          data.contactNumber?.trim() ||
          null,

        googleMapsUrl:
          data.googleMapsUrl?.trim() ||
          null,

        amenities:
          data.amenities ??
          [],

        roomTypes:
          data.roomTypes ??
          [],

        isPublished:
          data.isPublished ??
          false,
      }
    );


  return await formatProfile(
    profile
  );
}


export async function getPgProfileService(
  ownerId
) {
  const profile =
    await findPgProfileByOwner(
      db,
      ownerId
    );


  if (!profile) {
    throw new Error(
      "PG profile not found"
    );
  }


  return await formatProfile(
    profile
  );
}


export async function updatePgProfileService(
  ownerId,
  data
) {
  const profile =
    await findPgProfileByOwner(
      db,
      ownerId
    );


  if (!profile) {
    throw new Error(
      "PG profile not found"
    );
  }


  const changes = {};


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "pgName"
    )
  ) {
    changes.pgName =
      data.pgName.trim();
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "description"
    )
  ) {
    changes.description =
      data.description?.trim() ||
      null;
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "address"
    )
  ) {
    changes.address =
      data.address?.trim() ||
      null;
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "contactNumber"
    )
  ) {
    changes.contactNumber =
      data.contactNumber?.trim() ||
      null;
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "googleMapsUrl"
    )
  ) {
    changes.googleMapsUrl =
      data.googleMapsUrl?.trim() ||
      null;
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "amenities"
    )
  ) {
    changes.amenities =
      data.amenities ??
      [];
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "roomTypes"
    )
  ) {
    changes.roomTypes =
      data.roomTypes ??
      [];
  }


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "isPublished"
    )
  ) {
    changes.isPublished =
      data.isPublished;
  }


  const updated =
    await updatePgProfile(
      db,
      profile.id,
      changes
    );


  return await formatProfile(
    updated
  );
}


export async function uploadPgPhotoService(
  ownerId,
  file
) {
  const profile =
    await findPgProfileByOwner(
      db,
      ownerId
    );


  if (!profile) {
    throw new Error(
      "PG profile not found"
    );
  }


  const currentPhotos =
    await findPhotosByProfile(
      db,
      profile.id
    );


  if (
    currentPhotos.length >=
    MAX_PHOTOS
  ) {
    throw new Error(
      `Maximum ${MAX_PHOTOS} PG photos are allowed`
    );
  }


  const photoId =
    crypto.randomUUID();


  const cleanName =
    sanitizeFileName(
      file.name
    );


  const storagePath =
    `${ownerId}/${profile.id}/${photoId}-${cleanName}`;


  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );


  const {
    error: uploadError,
  } =
    await supabaseAdmin.storage
      .from(
        BUCKET_NAME
      )
      .upload(
        storagePath,
        buffer,
        {
          contentType:
            getPhotoContentType(
              file
            ),

          upsert: false,
        }
      );


  if (uploadError) {
    console.error(
      "PG photo upload error:",
      uploadError
    );

    throw new Error(
      `Failed to upload PG photo: ${uploadError.message}`
    );
  }


  try {
    const photo =
      await createPgPhoto(
        db,
        {
          id:
            photoId,

          pgProfileId:
            profile.id,

          storagePath,

          sortOrder:
            currentPhotos.length,
        }
      );


    return {
      id:
        photo.id,

      sortOrder:
        photo.sortOrder,

      fileUrl:
        await createPhotoSignedUrl(
          photo.storagePath
        ),

      createdAt:
        photo.createdAt,
    };
  } catch (error) {
    await supabaseAdmin.storage
      .from(
        BUCKET_NAME
      )
      .remove([
        storagePath,
      ]);

    throw error;
  }
}


export async function updatePgPhotoService(
  ownerId,
  photoId,
  sortOrder
) {
  const photo =
    await findPgPhotoForOwner(
      db,
      photoId,
      ownerId
    );


  if (!photo) {
    throw new Error(
      "PG photo not found"
    );
  }


  const updated =
    await updatePgPhotoSortOrder(
      db,
      photoId,
      sortOrder
    );


  return {
    id:
      updated.id,

    sortOrder:
      updated.sortOrder,

    fileUrl:
      await createPhotoSignedUrl(
        updated.storagePath
      ),
  };
}


export async function deletePgPhotoService(
  ownerId,
  photoId
) {
  const photo =
    await findPgPhotoForOwner(
      db,
      photoId,
      ownerId
    );


  if (!photo) {
    throw new Error(
      "PG photo not found"
    );
  }


  /*
   * Delete Storage object first.
   */
  const {
    error:
      storageError,
  } =
    await supabaseAdmin.storage
      .from(
        BUCKET_NAME
      )
      .remove([
        photo.storagePath,
      ]);


  if (storageError) {
    console.error(
      "Delete PG photo storage error:",
      storageError
    );

    throw new Error(
      "Failed to delete PG photo file"
    );
  }


  await deletePgPhoto(
    db,
    photoId
  );


  return {
    id:
      photoId,
  };
}