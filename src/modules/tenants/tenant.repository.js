import {
  eq,
  and,
  count,
  desc,
  inArray,
  asc,
  lte,
  gte,
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
  return await dbClient
    .select({
      id:
        tenants.id,

      fullName:
        tenants.fullName,

      mobile:
        tenants.mobile,

      dueDate:
        rentBills.dueDate,

      dateOfJoining:
        tenants.dateOfJoining,

      dateOfLeaving:
        tenants.dateOfLeaving,

      monthlyRent:
        tenants.monthlyRent,

      status:
        tenants.status,

      balanceAmount:
        rentBills.balanceAmount,

      roomId:
        rooms.id,

      roomNumber:
        rooms.roomNumber,

      floor:
        rooms.floor,
    })
    .from(tenants)
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
    .orderBy(
      asc(
        rooms.roomNumber
      )
    );
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
      .from(rooms)
      .where(
        eq(
          rooms.id,
          roomId
        )
      )
      .limit(1);

  return result[0] ?? null;
}


/* ======================================================
   CREATE TENANT
====================================================== */

export async function createTenant(
  dbClient,
  data
) {
  /*
   * dateOfJoining/dateOfBirth/etc.
   * are expected to already be
   * YYYY-MM-DD strings.
   */
  const result =
    await dbClient
      .insert(tenants)
      .values(data)
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
  /*
   * billingPeriodStart,
   * billingPeriodEnd and dueDate
   * are YYYY-MM-DD strings.
   */
  const result =
    await dbClient
      .insert(rentBills)
      .values(data)
      .returning();

  return result[0];
}


/* ======================================================
   FIND CURRENT RENT BILL
====================================================== */

export async function findCurrentRentBill(
  dbClient,
  tenantId,
  currentDate
) {
  if (!currentDate) {
    throw new Error(
      "Current date is required"
    );
  }

  /*
   * currentDate is expected to be:
   *
   * YYYY-MM-DD
   *
   * Example:
   * 2026-09-01
   *
   * rentBills.billingPeriodStart and
   * billingPeriodEnd are PostgreSQL DATE
   * columns, so all comparisons remain
   * date-only.
   */
  const result =
    await dbClient
      .select()
      .from(rentBills)
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

  return result[0] ?? null;
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
      .update(rentBills)
      .set({
        ...data,

        /*
         * updatedAt is an actual
         * timestamp, so Date is correct.
         */
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

  return result[0] ?? null;
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
      .values(data)
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
      .from(tenants)
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

  return result[0] ?? null;
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
      .from(tenants)
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


  if (!tenant) {
    return null;
  }


  const roomResult =
    tenant.roomId
      ? await dbClient
          .select()
          .from(rooms)
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
      .from(rentBills)
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
      .from(payments)
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
      .from(tenants)
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
      .update(tenants)
      .set({
        ...data,

        /*
         * updatedAt remains a real
         * timestamp.
         */
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


  return result[0] ?? null;
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

        /*
         * updatedAt remains a real
         * timestamp.
         */
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


  return result[0] ?? null;
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
  /*
   * leavingDate is expected to be
   * YYYY-MM-DD.
   */
  const result =
    await dbClient
      .update(tenants)
      .set({
        status:
          "ARCHIVED",

        dateOfLeaving:
          leavingDate,

        /*
         * updatedAt remains a real
         * timestamp.
         */
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


  return result[0] ?? null;
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
      .update(tenants)
      .set({
        status:
          "ACTIVE",

        dateOfLeaving:
          null,

        /*
         * updatedAt remains a real
         * timestamp.
         */
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


  return result[0] ?? null;
}