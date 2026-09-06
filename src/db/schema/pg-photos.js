import {
  pgTable,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import {
  pgProfiles,
} from "./pg-profile.js";


export const pgPhotos = pgTable(
  "pg_photos",
  {
    id: varchar("id", {
      length: 36,
    }).primaryKey(),

    pgProfileId: varchar(
      "pg_profile_id",
      {
        length: 36,
      }
    )
      .notNull()
      .references(
        () => pgProfiles.id,
        {
          onDelete: "cascade",
        }
      ),

    /*
     * Private Supabase Storage
     * object path.
     *
     * Do not store signed URL.
     */
    storagePath: varchar(
      "storage_path",
      {
        length: 1000,
      }
    ).notNull(),

    /*
     * 0 = first/cover image
     */
    sortOrder: integer(
      "sort_order"
    )
      .notNull()
      .default(0),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    profileIdx: index(
      "pg_photos_profile_idx"
    ).on(
      table.pgProfileId
    ),

    profileSortIdx: index(
      "pg_photos_profile_sort_idx"
    ).on(
      table.pgProfileId,
      table.sortOrder
    ),
  })
);