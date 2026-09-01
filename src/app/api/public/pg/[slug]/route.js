import {
  NextResponse,
} from "next/server";

import {
  and,
  asc,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/db";

import {
  pgProfiles,
  pgPhotos,
} from "@/db/schema";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";


const PG_PHOTOS_BUCKET =
  "pg-photos";

const SIGNED_URL_EXPIRY =
  60 * 10;


export async function GET(
  request,
  { params }
) {
  try {
    const {
      slug,
    } =
      await params;

    if (
      !slug ||
      typeof slug !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PG profile not found",
        },
        {
          status: 404,
        }
      );
    }


    /*
     * Public endpoint:
     * only published PG profiles
     * are allowed.
     */
    const [
      profile,
    ] =
      await db
        .select({
          id:
            pgProfiles.id,

          slug:
            pgProfiles.slug,

          pgName:
            pgProfiles.pgName,

          description:
            pgProfiles.description,

          address:
            pgProfiles.address,

          contactNumber:
            pgProfiles.contactNumber,

          googleMapsUrl:
            pgProfiles.googleMapsUrl,

          amenities:
            pgProfiles.amenities,

          roomTypes:
            pgProfiles.roomTypes,

          isPublished:
            pgProfiles.isPublished,
        })
        .from(
          pgProfiles
        )
        .where(
          and(
            eq(
              pgProfiles.slug,
              slug
            ),
            eq(
              pgProfiles.isPublished,
              true
            )
          )
        )
        .limit(1);


    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PG profile not found",
        },
        {
          status: 404,
        }
      );
    }


    const photos =
      await db
        .select({
          id:
            pgPhotos.id,

          storagePath:
            pgPhotos.storagePath,

          sortOrder:
            pgPhotos.sortOrder,
        })
        .from(
          pgPhotos
        )
        .where(
          eq(
            pgPhotos.pgProfileId,
            profile.id
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


    const signedPhotos =
      await Promise.all(
        photos.map(
          async (
            photo
          ) => {
            try {
              const {
                data,
                error,
              } =
                await supabaseAdmin.storage
                  .from(
                    PG_PHOTOS_BUCKET
                  )
                  .createSignedUrl(
                    photo.storagePath,
                    SIGNED_URL_EXPIRY
                  );

              if (error) {
                console.error(
                  "Create public PG photo signed URL error:",
                  error
                );

                return {
                  id:
                    photo.id,

                  sortOrder:
                    photo.sortOrder,

                  fileUrl:
                    null,
                };
              }

              return {
                id:
                  photo.id,

                sortOrder:
                  photo.sortOrder,

                fileUrl:
                  data?.signedUrl ??
                  null,
              };
            } catch (
              photoError
            ) {
              console.error(
                "Public PG photo error:",
                photoError
              );

              return {
                id:
                  photo.id,

                sortOrder:
                  photo.sortOrder,

                fileUrl:
                  null,
              };
            }
          }
        )
      );


    /*
     * Important:
     * ownerId, internal IDs and
     * management data are NOT
     * returned publicly.
     */
    return NextResponse.json({
      success: true,

      data: {
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
          Array.isArray(
            profile.amenities
          )
            ? profile.amenities
            : [],

        roomTypes:
          Array.isArray(
            profile.roomTypes
          )
            ? profile.roomTypes
            : [],

        photos:
          signedPhotos.filter(
            (photo) =>
              photo.fileUrl
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get public PG profile error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load PG profile",
      },
      {
        status: 500,
      }
    );
  }
}