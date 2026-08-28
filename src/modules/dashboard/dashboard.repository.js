import {
  and,
  desc,
  eq,
  inArray,
} from "drizzle-orm";

import {
  payments,
  rentBills,
  rooms,
  tenants,
} from "@/db/schema";


export async function findDashboardRooms(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      id: rooms.id,
      roomNumber: rooms.roomNumber,
      floor: rooms.floor,
      capacity: rooms.capacity,
      rentPerBed: rooms.rentPerBed,
      status: rooms.status,
    })
    .from(rooms)
    .where(
      and(
        eq(
          rooms.ownerId,
          ownerId
        ),
        eq(
          rooms.status,
          "ACTIVE"
        )
      )
    );
}


export async function findDashboardOccupants(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      id: tenants.id,
      roomId: tenants.roomId,
      status: tenants.status,
    })
    .from(tenants)
    .where(
      and(
        eq(
          tenants.ownerId,
          ownerId
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
}


export async function findDashboardTenants(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      id: tenants.id,
      fullName: tenants.fullName,
      mobile: tenants.mobile,
      roomId: tenants.roomId,
      status: tenants.status,
      dateOfJoining:
        tenants.dateOfJoining,
      dateOfLeaving:
        tenants.dateOfLeaving,
      monthlyRent:
        tenants.monthlyRent,
    })
    .from(tenants)
    .where(
      eq(
        tenants.ownerId,
        ownerId
      )
    );
}


export async function findDashboardRentBills(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      id:
        rentBills.id,

      tenantId:
        rentBills.tenantId,

      tenantName:
        tenants.fullName,

      roomNumber:
        rooms.roomNumber,

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
      eq(
        tenants.ownerId,
        ownerId
      )
    )
    .orderBy(
      desc(
        rentBills.dueDate
      )
    );
}

export async function findDashboardPayments(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      paymentId:
        payments.id,

      tenantId:
        payments.tenantId,

      rentBillId:
        payments.rentBillId,

      amount:
        payments.amount,

      paymentDate:
        payments.paymentDate,

      mode:
        payments.mode,

      tenantName:
        tenants.fullName,

      roomNumber:
        rooms.roomNumber,
    })
    .from(payments)
    .innerJoin(
      tenants,
      eq(
        payments.tenantId,
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
      eq(
        tenants.ownerId,
        ownerId
      )
    )
    .orderBy(
      desc(
        payments.paymentDate
      ),
      desc(
        payments.createdAt
      )
    );
}