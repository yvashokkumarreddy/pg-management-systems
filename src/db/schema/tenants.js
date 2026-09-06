import {
  pgTable,
  varchar,
  timestamp,
  date,
  decimal,
  pgEnum,
  index,
  integer,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { rooms } from "./rooms.js";


export const tenantStatusEnum =
  pgEnum(
    "tenant_status",
    [
      "ACTIVE",
      "NOTICE_PERIOD",
      "ARCHIVED",
    ]
  );


export const tenants = pgTable(
  "tenants",
  {
    id: varchar("id", {
      length: 36,
    }).primaryKey(),

    ownerId: varchar("owner_id", {
      length: 36,
    })
      .notNull()
      .references(() => users.id),

    roomId: varchar("room_id", {
      length: 36,
    }).references(() => rooms.id),

    fullName: varchar("full_name", {
      length: 150,
    }).notNull(),

    mobile: varchar("mobile", {
      length: 20,
    }).notNull(),

    // Calendar date - no timezone conversion
    dateOfBirth: date(
      "date_of_birth"
    ),

    emergencyContactName:
      varchar(
        "emergency_contact_name",
        {
          length: 150,
        }
      ),

    emergencyContactPhone:
      varchar(
        "emergency_contact_phone",
        {
          length: 20,
        }
      ),

    officeName: varchar(
      "office_name",
      {
        length: 200,
      }
    ),

    officeAddress: varchar(
      "office_address",
      {
        length: 500,
      }
    ),

    permanentAddress: varchar(
      "permanent_address",
      {
        length: 500,
      }
    ),

    /*
     * Historical joining date.
     *
     * This must NOT be changed simply
     * because the tenant changes their
     * monthly rent/payment cycle.
     */
    dateOfJoining: date(
      "date_of_joining"
    ).notNull(),

    // Calendar date - no timezone conversion
    dateOfLeaving: date(
      "date_of_leaving"
    ),
    noticeGivenDate: date(
  "notice_given_date"
),

plannedVacatingDate: date(
  "planned_vacating_date"
),

    /*
     * Permanent recurring rent-cycle
     * anchor.
     *
     * Examples:
     *
     * 3  = cycle normally starts on 3rd
     * 15 = cycle normally starts on 15th
     * 31 = month-end clamping is applied
     *      for shorter months.
     */
    rentCycleDay: integer(
      "rent_cycle_day"
    ).notNull(),

    monthlyRent: decimal(
      "monthly_rent",
      {
        precision: 10,
        scale: 2,
      }
    ).notNull(),

    status:
      tenantStatusEnum("status")
        .notNull()
        .default("ACTIVE"),

    // Actual timestamp - keep timezone
    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    // Actual timestamp - keep timezone
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
    ownerIdx: index(
      "tenants_owner_idx"
    ).on(
      table.ownerId
    ),

    roomIdx: index(
      "tenants_room_idx"
    ).on(
      table.roomId
    ),

    statusIdx: index(
      "tenants_status_idx"
    ).on(
      table.status
    ),
    

    mobileIdx: index(
      "tenants_mobile_idx"
    ).on(
      table.mobile
    ),
    
  })
);