import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import {
  payments,
  rentBills,
  rooms,
  tenants,
} from "@/db/schema";


export async function findTenantForPayment(
  dbClient,
  tenantId,
  ownerId
) {
  console.log(
    "Finding tenant for payment:",
    {
      tenantId,
      ownerId,
    }
  );
  const result = await dbClient
    .select({
      id:
        tenants.id,

      ownerId:
        tenants.ownerId,

      fullName:
        tenants.fullName,

      mobile:
        tenants.mobile,

      roomId:
        tenants.roomId,

      status:
        tenants.status,
    })
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


export async function findRentBillForPayment(
  dbClient,
  billId,
  tenantId,
  ownerId
) {
  console.log(
    "Finding rent bill for payment:",
    {
      billId,
      tenantId,
      ownerId,
    }
  );
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
          rentBills.id,
          billId
        ),
        eq(
          rentBills.tenantId,
          tenantId
        ),
        eq(
          tenants.ownerId,
          ownerId
        )
      )
    )
    .limit(1);
console.log(
    "Found rent bill for payment:",
    result
  );
  return result[0] ?? null;
}


export async function createPayment(
  dbClient,
  data
) {
  const result = await dbClient
    .insert(payments)
    .values(data)
    .returning();

  return result[0];
}


export async function updateRentBillAfterPayment(
  dbClient,
  billId,
  data
) {
  const result = await dbClient
    .update(rentBills)
    .set({
      amountPaid:
        data.amountPaid,

      balanceAmount:
        data.balanceAmount,

      status:
        data.status,

      updatedAt:
        new Date(),
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


export async function findPaymentsByOwner(
  dbClient,
  ownerId
) {
  return await dbClient
    .select({
      id:
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

      notes:
        payments.notes,

      createdAt:
        payments.createdAt,

      updatedAt:
        payments.updatedAt,

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

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      billDueDate:
        rentBills.dueDate,
    })
    .from(payments)
    .innerJoin(
      tenants,
      eq(
        payments.tenantId,
        tenants.id
      )
    )
    .innerJoin(
      rentBills,
      eq(
        payments.rentBillId,
        rentBills.id
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
      )
    );
}


export async function findPaymentById(
  dbClient,
  paymentId,
  ownerId
) {
  const result = await dbClient
    .select({
      id:
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

      notes:
        payments.notes,

      createdAt:
        payments.createdAt,

      updatedAt:
        payments.updatedAt,

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

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      billDueDate:
        rentBills.dueDate,

      billAmountDue:
        rentBills.amountDue,

      billAmountPaid:
        rentBills.amountPaid,

      billBalanceAmount:
        rentBills.balanceAmount,

      billStatus:
        rentBills.status,
    })
    .from(payments)
    .innerJoin(
      tenants,
      eq(
        payments.tenantId,
        tenants.id
      )
    )
    .innerJoin(
      rentBills,
      eq(
        payments.rentBillId,
        rentBills.id
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
          payments.id,
          paymentId
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


export async function findPaymentsByTenant(
  dbClient,
  tenantId,
  ownerId
) {
  return await dbClient
    .select({
      id:
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

      notes:
        payments.notes,

      createdAt:
        payments.createdAt,

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      billDueDate:
        rentBills.dueDate,
    })
    .from(payments)
    .innerJoin(
      tenants,
      eq(
        payments.tenantId,
        tenants.id
      )
    )
    .innerJoin(
      rentBills,
      eq(
        payments.rentBillId,
        rentBills.id
      )
    )
    .where(
      and(
        eq(
          payments.tenantId,
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
        payments.paymentDate
      )
    );
}