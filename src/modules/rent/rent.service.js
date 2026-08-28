import crypto from "crypto";

import { db } from "@/db";

import {
  createRentBill,
  findLatestRentBillByTenant,
  findRentBillByTenantAndStart,
  findRentBillDetailsById,
  findRentBillsByOwner,
  findRentBillsByTenant,
  findTenantForRent,
  updateRentBillStatus,
} from "./rent.repository.js";

import {
  calculateNextRentCycle,
  calculateRentCycle,
  calculateRentStatus,
} from "./rent.utils.js";


async function refreshBillStatus(
  bill
) {
  const calculatedStatus =
    calculateRentStatus({
      amountDue:
        bill.amountDue,

      amountPaid:
        bill.amountPaid,

      dueDate:
        bill.dueDate,
    });

  if (
    calculatedStatus !==
    bill.status
  ) {
    const updated =
      await updateRentBillStatus(
        db,
        bill.id,
        calculatedStatus
      );

    return {
      ...bill,
      status:
        updated?.status ??
        calculatedStatus,
    };
  }

  return bill;
}


async function refreshBillList(
  bills
) {
  return await Promise.all(
    bills.map(
      async (bill) =>
        await refreshBillStatus(
          bill
        )
    )
  );
}


export async function getRentBillsService(
  ownerId,
  status = null
) {
  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  /*
   * First fetch everything.
   *
   * We refresh overdue statuses because
   * there is intentionally no cron job yet.
   */
  const bills =
    await findRentBillsByOwner(
      db,
      ownerId
    );

  const refreshedBills =
    await refreshBillList(
      bills
    );

  if (!status) {
    return refreshedBills;
  }

  return refreshedBills.filter(
    (bill) =>
      bill.status === status
  );
}


export async function getRentBillByIdService(
  billId,
  ownerId
) {
  if (!billId) {
    throw new Error(
      "Bill ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const bill =
    await findRentBillDetailsById(
      db,
      billId,
      ownerId
    );

  if (!bill) {
    return null;
  }

  return await refreshBillStatus(
    bill
  );
}


export async function getTenantRentBillsService(
  tenantId,
  ownerId
) {
  if (!tenantId) {
    throw new Error(
      "Tenant ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const tenant =
    await findTenantForRent(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }

  const bills =
    await findRentBillsByTenant(
      db,
      tenantId,
      ownerId
    );

  return await refreshBillList(
    bills
  );
}


export async function generateNextRentBillService(
  tenantId,
  ownerId
) {
  if (!tenantId) {
    throw new Error(
      "Tenant ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const tenant =
    await findTenantForRent(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }

  if (
    tenant.status === "ARCHIVED"
  ) {
    throw new Error(
      "Rent bill cannot be generated for an archived tenant"
    );
  }

  if (
    Number(tenant.monthlyRent) <= 0
  ) {
    throw new Error(
      "Tenant monthly rent is invalid"
    );
  }

  const latestBill =
    await findLatestRentBillByTenant(
      db,
      tenantId
    );

  let cycle;

  /*
   * Normally first bill already exists
   * because tenant creation creates it.
   *
   * This fallback makes the rent module
   * safe even if older data has no bill.
   */
  if (!latestBill) {
    cycle = calculateRentCycle(
      tenant.dateOfJoining
    );
  } else {
    cycle = calculateNextRentCycle(
      latestBill
    );
  }

  /*
   * Don't accidentally generate
   * future rent bills.
   *
   * Example:
   * Current cycle starts Sep 17.
   * Calling this API on Sep 10 is rejected.
   */
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const cycleStart = new Date(
    cycle.billingPeriodStart
  );

  const normalizedCycleStart =
    new Date(
      cycleStart.getFullYear(),
      cycleStart.getMonth(),
      cycleStart.getDate()
    );

  if (
    normalizedCycleStart > today
  ) {
    throw new Error(
      "Next rent cycle has not started yet"
    );
  }

  const existingBill =
    await findRentBillByTenantAndStart(
      db,
      tenantId,
      cycle.billingPeriodStart
    );

  if (existingBill) {
    throw new Error(
      "Rent bill already exists for this billing cycle"
    );
  }

  const rentAmount =
    Number(
      tenant.monthlyRent
    );

  const bill =
    await createRentBill(
      db,
      {
        id:
          crypto.randomUUID(),

        tenantId,

        billingPeriodStart:
          cycle.billingPeriodStart,

        billingPeriodEnd:
          cycle.billingPeriodEnd,

        dueDate:
          cycle.dueDate,

        amountDue:
          String(rentAmount),

        amountPaid:
          "0",

        balanceAmount:
          String(rentAmount),

        status:
          "PENDING",
      }
    );

  return bill;
}