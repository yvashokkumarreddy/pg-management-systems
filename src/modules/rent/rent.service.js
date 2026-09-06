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
  findRentCollectionSummary,
  findTenantsForScheduledRent,
  findCurrentRentPositionsByOwner,
} from "./rent.repository.js";

import {
  calculateNextRentCycle,
  calculateRentCycle,
  calculateRentStatus,
} from "./rent.utils.js";


/* ======================================================
   DATE HELPERS
====================================================== */

/*
 * All rent-cycle business dates are based
 * on India calendar dates.
 *
 * Do not depend on the timezone of the
 * Node/Vercel runtime.
 */
function getTodayDateString() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kolkata",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );


  const values =
    {};


  for (
    const part of
    parts
  ) {
    if (
      part.type !==
      "literal"
    ) {
      values[
        part.type
      ] =
        part.value;
    }
  }


  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}`
  );
}


/* ======================================================
   REFRESH BILL STATUS
====================================================== */

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
      async (
        bill
      ) =>
        await refreshBillStatus(
          bill
        )
    )
  );
}


/* ======================================================
   GET ALL RENT BILLS
====================================================== */

export async function getRentBillsService(
  ownerId,
  status = null
) {
  if (
    !ownerId
  ) {
    throw new Error(
      "Owner ID is required"
    );
  }


  const [
    bills,
    collectionSummary,
  ] =
    await Promise.all([
      findRentBillsByOwner(
        db,
        ownerId
      ),

      findRentCollectionSummary(
        db,
        ownerId
      ),
    ]);


  const refreshedBills =
    await refreshBillList(
      bills
    );


  const filteredBills =
    status
      ? refreshedBills.filter(
          (
            bill
          ) =>
            bill.status ===
            status
        )
      : refreshedBills;


  return {
    bills:
      filteredBills,

    summary: {
      collectedThisMonth:
        collectionSummary
          .collectedThisMonth,

      lifetimeCollected:
        collectionSummary
          .lifetimeCollected,
    },
  };
}

/* ======================================================
   GET CURRENT RENT POSITIONS
====================================================== */

export async function getCurrentRentPositionsService(
  ownerId,
  status = null
) {
  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }


  const [
    result,
    collectionSummary,
  ] =
    await Promise.all([
      findCurrentRentPositionsByOwner(
        db,
        ownerId
      ),
      

      findRentCollectionSummary(
        db,
        ownerId
      ),
    ]);



  const rawRows =
    Array.isArray(result)
      ? result
      : result?.rows ?? [];


  const positions =
    await Promise.all(
      rawRows.map(
        async (row) => {
          const currentAmountDue =
            Number(
              row.currentAmountDue ??
                0
            );

          const currentAmountPaid =
            Number(
              row.currentAmountPaid ??
                0
            );

          const currentBalanceAmount =
            Number(
              row.currentBalanceAmount ??
                0
            );

          const previousOutstanding =
            Number(
              row.previousOutstanding ??
                0
            );

          const totalOutstanding =
            Number(
              row.totalOutstanding ??
                0
            );


          let currentStatus =
            row.currentStatus ??
            null;


          if (
            row.currentBillId
          ) {
            currentStatus =
              calculateRentStatus({
                amountDue:
                  currentAmountDue,

                amountPaid:
                  currentAmountPaid,

                dueDate:
                  row.dueDate,
              });


            if (
              currentStatus !==
              row.currentStatus
            ) {
              await updateRentBillStatus(
                db,
                row.currentBillId,
                currentStatus
              );
            }
          }


          return {
            tenantId:
              row.tenantId,

            tenantName:
              row.tenantName,

            tenantMobile:
              row.tenantMobile,

            tenantStatus:
              row.tenantStatus,

            rentCycleDay:
              row.rentCycleDay,

            monthlyRent:
              Number(
                row.monthlyRent ??
                  0
              ),

            roomId:
              row.roomId,

            roomNumber:
              row.roomNumber,

            floor:
              row.floor,

            currentBillId:
              row.currentBillId,

            billingPeriodStart:
              row.billingPeriodStart,

            billingPeriodEnd:
              row.billingPeriodEnd,

            dueDate:
              row.dueDate,

            currentAmountDue,

            currentAmountPaid,

            currentBalanceAmount,

            currentStatus,

            previousOutstanding,

            totalOutstanding,

            hasPreviousOutstanding:
              previousOutstanding >
              0,
          };
        }
      )
    );


  const filteredPositions =
    status
      ? positions.filter(
          (position) =>
            position.currentStatus ===
            status
        )
      : positions;


  return {
    positions:
      filteredPositions,

    summary: {
      collectedThisMonth:
        collectionSummary
          .collectedThisMonth,

      lifetimeCollected:
        collectionSummary
          .lifetimeCollected,
    },
  };
}

/* ======================================================
   GET RENT BILL
====================================================== */

export async function getRentBillByIdService(
  billId,
  ownerId
) {
  if (
    !billId
  ) {
    throw new Error(
      "Bill ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !bill
  ) {
    return null;
  }


  return await refreshBillStatus(
    bill
  );
}


/* ======================================================
   GET TENANT RENT BILLS
====================================================== */

export async function getTenantRentBillsService(
  tenantId,
  ownerId
) {
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !tenant
  ) {
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


/* ======================================================
   GENERATE NEXT RENT BILL
====================================================== */

export async function generateNextRentBillService(
  tenantId,
  ownerId
) {
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !tenant
  ) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    tenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Rent bill cannot be generated for an archived tenant"
    );
  }


  const rentAmount =
    Number(
      tenant.monthlyRent
    );


  if (
    !Number.isFinite(
      rentAmount
    ) ||
    rentAmount <= 0
  ) {
    throw new Error(
      "Tenant monthly rent is invalid"
    );
  }


  const rentCycleDay =
    Number(
      tenant.rentCycleDay
    );


  if (
    !Number.isInteger(
      rentCycleDay
    ) ||
    rentCycleDay < 1 ||
    rentCycleDay > 31
  ) {
    throw new Error(
      "Tenant rent cycle is invalid"
    );
  }


  if (
    tenant.status ===
      "NOTICE_PERIOD" &&
    !tenant.plannedVacatingDate
  ) {
    throw new Error(
      "Notice-period tenant has no planned vacating date"
    );
  }


  const latestBill =
    await findLatestRentBillByTenant(
      db,
      tenantId
    );


  let cycle;


  /*
   * Normally tenant creation creates the
   * first bill.
   *
   * This fallback supports old/repaired
   * tenant data where no bill exists.
   */
  if (
    !latestBill
  ) {
    cycle =
      calculateRentCycle(
        tenant.dateOfJoining,
        rentCycleDay
      );
  } else {
    /*
     * Permanent cycle anchor always comes
     * from tenant.rentCycleDay.
     *
     * latestBill.dueDate determines the
     * next starting point.
     *
     * This also correctly handles a
     * one-time transition bill.
     */
    cycle =
      calculateNextRentCycle(
        latestBill,
        rentCycleDay
      );
  }


  const today =
    getTodayDateString();


  if (
    cycle.billingPeriodStart >
    today
  ) {
    throw new Error(
      "Next rent cycle has not started yet"
    );
  }


  /*
   * NOTICE PERIOD CUT-OFF
   *
   * Example:
   *
   * noticeGivenDate:
   * 2026-10-03
   *
   * plannedVacatingDate:
   * 2026-11-03
   *
   * 03 Oct -> 02 Nov is allowed.
   *
   * A cycle starting on 03 Nov is not.
   */
  if (
    tenant.status ===
      "NOTICE_PERIOD" &&
    tenant.plannedVacatingDate &&
    cycle.billingPeriodStart >=
      tenant.plannedVacatingDate
  ) {
    throw new Error(
      "Rent bill cannot be generated on or after the planned vacating date"
    );
  }


  const existingBill =
    await findRentBillByTenantAndStart(
      db,
      tenantId,
      cycle.billingPeriodStart
    );


  if (
    existingBill
  ) {
    throw new Error(
      "Rent bill already exists for this billing cycle"
    );
  }


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

        /*
         * Regular recurring rent ALWAYS
         * comes from tenant.monthlyRent.
         *
         * Never copy the amount from the
         * previous bill because that bill
         * may be a transition bill.
         */
        amountDue:
          String(
            rentAmount
          ),

        amountPaid:
          "0",

        balanceAmount:
          String(
            rentAmount
          ),

        status:
          "PENDING",
      }
    );


  return bill;
}


/* ======================================================
   SCHEDULED / CATCH-UP RENT BILLING
====================================================== */

export async function processScheduledRentBillingService() {
  const tenants =
    await findTenantsForScheduledRent(
      db
    );


  const today =
    getTodayDateString();


  const summary = {
    businessDate:
      today,

    processedTenants:
      0,

    generatedBills:
      0,

    skippedTenants:
      0,

    failedTenants:
      0,

    results:
      [],
  };


  for (
    const tenant of
    tenants
  ) {
    summary.processedTenants +=
      1;


    try {
      const result =
        await processScheduledRentForTenant(
          tenant,
          today
        );


      summary.generatedBills +=
        result.generatedBills.length;


      if (
        result.generatedBills.length ===
        0
      ) {
        summary.skippedTenants +=
          1;
      }


      summary.results.push({
        tenantId:
          tenant.id,

        tenantName:
          tenant.fullName,

        success:
          true,

        reason:
          result.reason,

        generatedBills:
          result.generatedBills,
      });
    } catch (
      error
    ) {
      summary.failedTenants +=
        1;


      console.error(
        `Scheduled rent generation failed for tenant ${tenant.id}:`,
        error
      );


      summary.results.push({
        tenantId:
          tenant.id,

        tenantName:
          tenant.fullName,

        success:
          false,

        message:
          error.message ||
          "Rent generation failed",
      });
    }
  }


  return summary;
}


/* ======================================================
   PROCESS ONE TENANT
====================================================== */

async function processScheduledRentForTenant(
  tenant,
  today
) {
  /*
   * Repository normally returns only
   * ACTIVE and NOTICE_PERIOD tenants.
   *
   * Keep this defensive check so an
   * archived tenant can never receive a
   * future bill even if repository logic
   * changes later.
   */
  if (
    tenant.status ===
    "ARCHIVED"
  ) {
    return {
      reason:
        "ARCHIVED",

      generatedBills:
        [],
    };
  }


  const monthlyRent =
    Number(
      tenant.monthlyRent
    );


  if (
    !Number.isFinite(
      monthlyRent
    ) ||
    monthlyRent <= 0
  ) {
    throw new Error(
      "Tenant monthly rent is invalid"
    );
  }


  const rentCycleDay =
    Number(
      tenant.rentCycleDay
    );


  if (
    !Number.isInteger(
      rentCycleDay
    ) ||
    rentCycleDay < 1 ||
    rentCycleDay > 31
  ) {
    throw new Error(
      "Tenant rent cycle day is invalid"
    );
  }


  /*
   * Fail safely when a NOTICE_PERIOD
   * tenant has incomplete notice data.
   *
   * It is safer to stop billing this
   * tenant and report the data problem
   * than to generate rent indefinitely.
   */
  if (
    tenant.status ===
      "NOTICE_PERIOD" &&
    !tenant.plannedVacatingDate
  ) {
    throw new Error(
      "Notice-period tenant has no planned vacating date"
    );
  }


  const generatedBills =
    [];


  /*
   * Corrupt data should never be able to
   * create an infinite catch-up loop.
   *
   * 120 cycles = 10 years of monthly
   * catch-up, already far beyond normal
   * usage.
   */
  const MAX_CATCH_UP_CYCLES =
    120;


  for (
    let iteration = 0;
    iteration <
    MAX_CATCH_UP_CYCLES;
    iteration += 1
  ) {
    const latestBill =
      await findLatestRentBillByTenant(
        db,
        tenant.id
      );


    let cycle;


    if (
      !latestBill
    ) {
      cycle =
        calculateRentCycle(
          tenant.dateOfJoining,
          rentCycleDay
        );
    } else {
      cycle =
        calculateNextRentCycle(
          latestBill,
          rentCycleDay
        );
    }


    /*
     * The next cycle has not started in
     * India yet.
     *
     * Tenant is fully caught up.
     */
    if (
      cycle.billingPeriodStart >
      today
    ) {
      return {
        reason:
          generatedBills.length >
          0
            ? "CAUGHT_UP"
            : "NEXT_CYCLE_NOT_STARTED",

        generatedBills,
      };
    }


    /*
     * NOTICE PERIOD RULE
     *
     * rentCycleDay = 3
     *
     * notice:
     * 03 Oct
     *
     * planned vacating:
     * 03 Nov
     *
     * 03 Oct -> 02 Nov
     * is the final normal rent cycle.
     *
     * A cycle beginning on 03 Nov must
     * never be generated.
     */
    if (
      tenant.status ===
        "NOTICE_PERIOD" &&
      tenant.plannedVacatingDate &&
      cycle.billingPeriodStart >=
        tenant.plannedVacatingDate
    ) {
      return {
        reason:
          "PLANNED_VACATING_DATE_REACHED",

        generatedBills,
      };
    }


    const existingBill =
      await findRentBillByTenantAndStart(
        db,
        tenant.id,
        cycle.billingPeriodStart
      );


    /*
     * Defensive idempotency check.
     *
     * The DB unique constraint on:
     *
     * tenantId + billingPeriodStart
     *
     * remains the final duplicate
     * protection.
     */
    if (
      existingBill
    ) {
      return {
        reason:
          "BILL_ALREADY_EXISTS",

        generatedBills,
      };
    }


    const bill =
      await createRentBill(
        db,
        {
          id:
            crypto.randomUUID(),

          tenantId:
            tenant.id,

          billingPeriodStart:
            cycle.billingPeriodStart,

          billingPeriodEnd:
            cycle.billingPeriodEnd,

          dueDate:
            cycle.dueDate,

          /*
           * Never use latestBill.amountDue.
           *
           * A previous bill may be the
           * one-time transition amount.
           */
          amountDue:
            String(
              monthlyRent
            ),

          amountPaid:
            "0",

          balanceAmount:
            String(
              monthlyRent
            ),

          status:
            "PENDING",
        }
      );


    generatedBills.push(
      bill
    );
  }


  throw new Error(
    "Maximum rent catch-up cycle limit reached"
  );
}