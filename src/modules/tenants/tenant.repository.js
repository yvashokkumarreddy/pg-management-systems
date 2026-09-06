import {
  eq,
  and,
  count,
  desc,
  inArray,
  asc,
  lte,
  gte,
  sql,
} from "drizzle-orm";

import {
  tenants,
  rooms,
  rentBills,
  payments,
  tenantDeposits,
} from "@/db/schema";


/* ======================================================
   FIND TENANTS BY OWNER
====================================================== */

export async function findTenantsByOwner(
  dbClient,
  ownerId
) {
  /*
   * IMPORTANT:
   *
   * rentBills is a one-to-many relationship.
   *
   * A normal LEFT JOIN without aggregation would return:
   *
   * Tenant A + Bill 1
   * Tenant A + Bill 2
   * Tenant A + Bill 3
   *
   * which causes duplicate tenant rows in the Tenants page.
   *
   * We therefore GROUP BY the tenant/room fields and aggregate
   * bill-level financial information.
   *
   * Result:
   *
   * ONE database row per tenant.
   */


  const result =
    await dbClient
      .select({
        id:
          tenants.id,

        fullName:
          tenants.fullName,

        mobile:
          tenants.mobile,

        dateOfJoining:
          tenants.dateOfJoining,

        dateOfLeaving:
          tenants.dateOfLeaving,

        rentCycleDay:
          tenants.rentCycleDay,

        monthlyRent:
          tenants.monthlyRent,

        status:
          tenants.status,

        roomId:
          rooms.id,

        roomNumber:
          rooms.roomNumber,

        floor:
          rooms.floor,


        /*
         * TOTAL OUTSTANDING
         *
         * Example:
         *
         * Normal bill      ₹4,500
         * Transition bill    ₹500
         *
         * balanceAmount = ₹5,000
         *
         * COALESCE makes tenants with no rent bills return 0.
         */
        balanceAmount:
          sql`COALESCE(SUM(${rentBills.balanceAmount}), 0)`,


        /*
         * DUE DATE
         *
         * We only care about bills that still have an
         * outstanding balance.
         *
         * If there are multiple outstanding bills, show
         * the earliest due date because that is the most
         * urgent outstanding obligation.
         *
         * Fully paid bills are ignored.
         */
        dueDate:
          sql`
            COALESCE(
              MIN(
                CASE
                  WHEN ${rentBills.balanceAmount} > 0
                  THEN ${rentBills.dueDate}
                  ELSE NULL
                END
              ),
              MAX(${rentBills.dueDate})
            )
          `,
      })
      .from(
        tenants
      )
      .leftJoin(
        rooms,
        eq(
          tenants.roomId,
          rooms.id
        )
      )
      .leftJoin(
        rentBills,
        eq(
          rentBills.tenantId,
          tenants.id
        )
      )
      .where(
        eq(
          tenants.ownerId,
          ownerId
        )
      )
      .groupBy(
        tenants.id,
        tenants.fullName,
        tenants.mobile,
        tenants.dateOfJoining,
        tenants.dateOfLeaving,
        tenants.rentCycleDay,
        tenants.monthlyRent,
        tenants.status,
        rooms.id,
        rooms.roomNumber,
        rooms.floor
      )
      .orderBy(
        asc(
          rooms.roomNumber
        )
      );


  /*
   * PostgreSQL SUM(decimal/numeric) may be returned by
   * the driver as a string.
   *
   * The frontend already safely converts balanceAmount
   * with Number(), so preserving the numeric-string form
   * is perfectly valid.
   */
  return result;
}


/* ======================================================
   FIND ROOM BY ID
====================================================== */

export async function findRoomById(
  dbClient,
  roomId
) {
  const result =
    await dbClient
      .select()
      .from(
        rooms
      )
      .where(
        eq(
          rooms.id,
          roomId
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   CREATE TENANT
====================================================== */

export async function createTenant(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        tenants
      )
      .values(
        data
      )
      .returning();


  return result[0];
}


/* ======================================================
   CREATE RENT BILL
====================================================== */

export async function createRentBill(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        rentBills
      )
      .values(
        data
      )
      .returning();


  return result[0];
}


/* ======================================================
   FIND RENT BILL BY TENANT + START
====================================================== */

export async function findRentBillByTenantAndStart(
  dbClient,
  tenantId,
  billingPeriodStart
) {
  const result =
    await dbClient
      .select()
      .from(
        rentBills
      )
      .where(
        and(
          eq(
            rentBills.tenantId,
            tenantId
          ),

          eq(
            rentBills.billingPeriodStart,
            billingPeriodStart
          )
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   FIND CURRENT RENT BILL
====================================================== */

export async function findCurrentRentBill(
  dbClient,
  tenantId,
  currentDate
) {
  if (
    !currentDate
  ) {
    throw new Error(
      "Current date is required"
    );
  }


  const result =
    await dbClient
      .select()
      .from(
        rentBills
      )
      .where(
        and(
          eq(
            rentBills.tenantId,
            tenantId
          ),

          lte(
            rentBills.billingPeriodStart,
            currentDate
          ),

          gte(
            rentBills.billingPeriodEnd,
            currentDate
          )
        )
      )
      .orderBy(
        desc(
          rentBills.billingPeriodStart
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   UPDATE RENT BILL
====================================================== */

export async function updateRentBill(
  dbClient,
  rentBillId,
  data
) {
  const result =
    await dbClient
      .update(
        rentBills
      )
      .set({
        ...data,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          rentBills.id,
          rentBillId
        )
      )
      .returning();


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   CREATE TENANT DEPOSIT
====================================================== */

export async function createTenantDeposit(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        tenantDeposits
      )
      .values(
        data
      )
      .returning();


  return result[0];
}


/* ======================================================
   FIND TENANT BY ID
====================================================== */

export async function findTenantById(
  dbClient,
  tenantId,
  ownerId
) {
  const result =
    await dbClient
      .select()
      .from(
        tenants
      )
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   FIND TENANT DETAILS BY ID
====================================================== */

export async function findTenantDetailsById(
  dbClient,
  tenantId,
  ownerId
) {
  const tenantResult =
    await dbClient
      .select()
      .from(
        tenants
      )
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .limit(1);


  const tenant =
    tenantResult[0];


  if (
    !tenant
  ) {
    return null;
  }


  const roomResult =
    tenant.roomId
      ? await dbClient
          .select()
          .from(
            rooms
          )
          .where(
            eq(
              rooms.id,
              tenant.roomId
            )
          )
          .limit(1)
      : [];


  const depositResult =
    await dbClient
      .select()
      .from(
        tenantDeposits
      )
      .where(
        eq(
          tenantDeposits.tenantId,
          tenantId
        )
      )
      .limit(1);


  const bills =
    await dbClient
      .select()
      .from(
        rentBills
      )
      .where(
        eq(
          rentBills.tenantId,
          tenantId
        )
      )
      .orderBy(
        desc(
          rentBills.billingPeriodStart
        )
      );


  const tenantPayments =
    await dbClient
      .select()
      .from(
        payments
      )
      .where(
        eq(
          payments.tenantId,
          tenantId
        )
      )
      .orderBy(
        desc(
          payments.paymentDate
        )
      );


  return {
    ...tenant,

    room:
      roomResult[0] ??
      null,

    deposit:
      depositResult[0] ??
      null,

    rentBills:
      bills,

    payments:
      tenantPayments,
  };
}


/* ======================================================
   COUNT OCCUPIED BEDS BY ROOM
====================================================== */

export async function countOccupiedBedsByRoom(
  dbClient,
  roomId
) {
  const result =
    await dbClient
      .select({
        count:
          count(),
      })
      .from(
        tenants
      )
      .where(
        and(
          eq(
            tenants.roomId,
            roomId
          ),

          inArray(
            tenants.status,
            [
              "ACTIVE",
              "NOTICE_PERIOD",
            ]
          )
        )
      );


  return (
    result[0]?.count ??
    0
  );
}


/* ======================================================
   UPDATE TENANT
====================================================== */

export async function updateTenant(
  dbClient,
  tenantId,
  ownerId,
  data
) {
  const result =
    await dbClient
      .update(
        tenants
      )
      .set({
        ...data,

        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .returning();


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   UPDATE TENANT DEPOSIT
====================================================== */

export async function updateTenantDeposit(
  dbClient,
  tenantId,
  data
) {
  const result =
    await dbClient
      .update(
        tenantDeposits
      )
      .set({
        ...data,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          tenantDeposits.tenantId,
          tenantId
        )
      )
      .returning();


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   ARCHIVE TENANT
====================================================== */

export async function archiveTenant(
  dbClient,
  tenantId,
  ownerId,
  leavingDate
) {
  const result =
    await dbClient
      .update(
        tenants
      )
      .set({
        status:
          "ARCHIVED",

        dateOfLeaving:
          leavingDate,

        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .returning();


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   RESTORE / ACTIVATE TENANT
====================================================== */

export async function restoreTenant(
  dbClient,
  tenantId,
  ownerId
) {
  const result =
    await dbClient
      .update(
        tenants
      )
      .set({
        status:
          "ACTIVE",

        dateOfLeaving:
          null,

        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .returning();


  return (
    result[0] ??
    null
  );
}