import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import {
  rentBills,
  rooms,
  tenants,
} from "@/db/schema";


export async function findTenantForRent(
  dbClient,
  tenantId,
  ownerId
) {
  const result = await dbClient
    .select({
      id: tenants.id,
      ownerId: tenants.ownerId,
      roomId: tenants.roomId,

      fullName: tenants.fullName,
      mobile: tenants.mobile,

      dateOfJoining:
        tenants.dateOfJoining,

      dateOfLeaving:
        tenants.dateOfLeaving,

      monthlyRent:
        tenants.monthlyRent,

      status:
        tenants.status,
    })
    .from(tenants)
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.ownerId, ownerId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}


export async function createRentBill(
  dbClient,
  data
) {
  const result = await dbClient
    .insert(rentBills)
    .values(data)
    .returning();

  return result[0];
}


export async function findLatestRentBillByTenant(
  dbClient,
  tenantId
) {
  const result = await dbClient
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
    )
    .limit(1);

  return result[0] ?? null;
}


export async function findRentBillByTenantAndStart(
  dbClient,
  tenantId,
  billingPeriodStart
) {
  const result = await dbClient
    .select()
    .from(rentBills)
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

  return result[0] ?? null;
}


export async function updateRentBillStatus(
  dbClient,
  billId,
  status
) {
  const result = await dbClient
    .update(rentBills)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      eq(
        rentBills.id,
        billId
      )
    )
    .returning();

  return result[0] ?? null;
}


export async function findRentBillsByOwner(
  dbClient,
  ownerId,
  status = null
) {
  const conditions = [
    eq(
      tenants.ownerId,
      ownerId
    ),
  ];

  if (status) {
    conditions.push(
      eq(
        rentBills.status,
        status
      )
    );
  }

  return await dbClient
    .select({
      id:
        rentBills.id,

      tenantId:
        rentBills.tenantId,

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      dueDate:
        rentBills.dueDate,

      amountDue:
        rentBills.amountDue,

      amountPaid:
        rentBills.amountPaid,

      balanceAmount:
        rentBills.balanceAmount,

      status:
        rentBills.status,

      createdAt:
        rentBills.createdAt,

      updatedAt:
        rentBills.updatedAt,

      tenantName:
        tenants.fullName,

      tenantMobile:
        tenants.mobile,

      tenantStatus:
        tenants.status,

      roomId:
        rooms.id,

      roomNumber:
        rooms.roomNumber,

      floor:
        rooms.floor,
    })
    .from(rentBills)
    .innerJoin(
      tenants,
      eq(
        rentBills.tenantId,
        tenants.id
      )
    )
    .leftJoin(
      rooms,
      eq(
        tenants.roomId,
        rooms.id
      )
    )
    .where(
      and(...conditions)
    )
    .orderBy(
      desc(rentBills.dueDate)
    );
}


export async function findRentBillsByTenant(
  dbClient,
  tenantId,
  ownerId
) {
  return await dbClient
    .select({
      id:
        rentBills.id,

      tenantId:
        rentBills.tenantId,

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      dueDate:
        rentBills.dueDate,

      amountDue:
        rentBills.amountDue,

      amountPaid:
        rentBills.amountPaid,

      balanceAmount:
        rentBills.balanceAmount,

      status:
        rentBills.status,

      createdAt:
        rentBills.createdAt,

      updatedAt:
        rentBills.updatedAt,
    })
    .from(rentBills)
    .innerJoin(
      tenants,
      eq(
        rentBills.tenantId,
        tenants.id
      )
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
    .orderBy(
      desc(
        rentBills.billingPeriodStart
      )
    );
}


export async function findRentBillDetailsById(
  dbClient,
  billId,
  ownerId
) {
  const result = await dbClient
    .select({
      id:
        rentBills.id,

      tenantId:
        rentBills.tenantId,

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      dueDate:
        rentBills.dueDate,

      amountDue:
        rentBills.amountDue,

      amountPaid:
        rentBills.amountPaid,

      balanceAmount:
        rentBills.balanceAmount,

      status:
        rentBills.status,

      createdAt:
        rentBills.createdAt,

      updatedAt:
        rentBills.updatedAt,

      tenantName:
        tenants.fullName,

      tenantMobile:
        tenants.mobile,

      tenantStatus:
        tenants.status,

      roomId:
        rooms.id,

      roomNumber:
        rooms.roomNumber,

      floor:
        rooms.floor,
    })
    .from(rentBills)
    .innerJoin(
      tenants,
      eq(
        rentBills.tenantId,
        tenants.id
      )
    )
    .leftJoin(
      rooms,
      eq(
        tenants.roomId,
        rooms.id
      )
    )
    .where(
      and(
        eq(
          rentBills.id,
          billId
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