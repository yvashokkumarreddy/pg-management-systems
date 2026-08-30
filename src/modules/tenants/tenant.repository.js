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


export async function findTenantsByOwner(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      id: tenants.id,
      fullName: tenants.fullName,
      mobile: tenants.mobile,
      dueDate:rentBills.dueDate,
      dateOfJoining: tenants.dateOfJoining,
      dateOfLeaving: tenants.dateOfLeaving,
      monthlyRent: tenants.monthlyRent,
      status: tenants.status,
      balanceAmount: rentBills.balanceAmount,
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      floor: rooms.floor,
    })
    .from(tenants)
    .leftJoin(
      rooms,
      eq(tenants.roomId, rooms.id)
    )
    .leftJoin(
      rentBills,
        eq(rentBills.tenantId, tenants.id))
    .where(
      eq(tenants.ownerId, ownerId)
    )
     .orderBy(asc(rooms.roomNumber));
}


export async function findRoomById(
  dbClient,
  roomId
) {
  const result =
    await dbClient
      .select()
      .from(rooms)
      .where(
        eq(rooms.id, roomId)
      )
      .limit(1);

  return result[0] ?? null;
}


export async function createTenant(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(tenants)
      .values(data)
      .returning();

  return result[0];
}


export async function createRentBill(
  dbClient,
  data
) {
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
  currentDate = new Date()
) {
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

export async function createTenantDeposit(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(tenantDeposits)
      .values(data)
      .returning();

  return result[0];
}


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
      .from(tenantDeposits)
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


export async function countOccupiedBedsByRoom(
  dbClient,
  roomId
) {
  const result =
    await dbClient
      .select({
        count: count(),
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

  return result[0] ?? null;
}


export async function archiveTenant(
  dbClient,
  tenantId,
  ownerId,
  leavingDate
) {
  const result =
    await dbClient
      .update(tenants)
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