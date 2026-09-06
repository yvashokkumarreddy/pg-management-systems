import crypto from "crypto";

import {
  db,
} from "@/db";

import {
  createPayment,
  findPaymentById,
  findPaymentsByOwner,
  findPaymentsByTenant,
  findRentBillForPayment,
  findTenantForPayment,
  startTenantNoticePeriod,
  updateRentBillAfterPayment,
} from "./payment.repository.js";


/* ======================================================
   DATE HELPERS
====================================================== */

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


  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}


function getDaysInMonth(
  year,
  month
) {
  return new Date(
    year,
    month,
    0
  ).getDate();
}


function formatDateString(
  year,
  month,
  day
) {
  return [
    String(
      year
    ).padStart(
      4,
      "0"
    ),

    String(
      month
    ).padStart(
      2,
      "0"
    ),

    String(
      day
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}


function getCycleBoundaryForMonth(
  year,
  month,
  rentCycleDay
) {
  const lastDay =
    getDaysInMonth(
      year,
      month
    );


  const day =
    Math.min(
      Number(
        rentCycleDay
      ),
      lastDay
    );


  return formatDateString(
    year,
    month,
    day
  );
}


function getNextMonth(
  year,
  month
) {
  if (
    month === 12
  ) {
    return {
      year:
        year + 1,

      month:
        1,
    };
  }


  return {
    year,

    month:
      month + 1,
  };
}


/* ======================================================
   NOTICE DATE CALCULATION
====================================================== */

/*
 * RULE:
 *
 * Tenant must provide one complete rent
 * cycle of notice.
 *
 * Example:
 *
 * rentCycleDay = 3
 *
 * Notice on 03 Oct
 * -> Vacating 03 Nov
 *
 * Notice on 06 Sep
 * -> First complete notice cycle is
 *    03 Oct -> 02 Nov
 * -> Vacating 03 Nov
 *
 * Notice on 01 Sep
 * -> First complete cycle is
 *    03 Sep -> 02 Oct
 * -> Vacating 03 Oct
 */
function calculatePlannedVacatingDate(
  noticeGivenDate,
  rentCycleDay
) {
  const [
    year,
    month,
  ] =
    noticeGivenDate
      .split("-")
      .map(Number);


  const currentBoundary =
    getCycleBoundaryForMonth(
      year,
      month,
      rentCycleDay
    );


  /*
   * Notice given exactly on the current
   * rent-cycle boundary.
   */
  if (
    noticeGivenDate ===
    currentBoundary
  ) {
    const next =
      getNextMonth(
        year,
        month
      );


    return getCycleBoundaryForMonth(
      next.year,
      next.month,
      rentCycleDay
    );
  }


  /*
   * Notice given after this month's
   * boundary.
   *
   * The next rent cycle becomes the full
   * notice cycle.
   */
  if (
    noticeGivenDate >
    currentBoundary
  ) {
    const next =
      getNextMonth(
        year,
        month
      );


    const afterNext =
      getNextMonth(
        next.year,
        next.month
      );


    return getCycleBoundaryForMonth(
      afterNext.year,
      afterNext.month,
      rentCycleDay
    );
  }


  /*
   * Notice given before this month's
   * boundary.
   *
   * The upcoming rent cycle can serve as
   * the full notice cycle.
   */
  const next =
    getNextMonth(
      year,
      month
    );


  return getCycleBoundaryForMonth(
    next.year,
    next.month,
    rentCycleDay
  );
}


/* ======================================================
   MONEY HELPERS
====================================================== */

function roundMoney(
  value
) {
  return (
    Math.round(
      Number(
        value
      ) *
        100
    ) /
    100
  );
}


/* ======================================================
   CALCULATE BILL STATUS
====================================================== */

function calculateBillStatus({
  amountDue,
  amountPaid,
  dueDate,
}) {
  const due =
    Number(
      amountDue
    );


  const paid =
    Number(
      amountPaid
    );


  if (
    paid >=
    due
  ) {
    return "PAID";
  }


  const today =
    getTodayDateString();


  if (
    dueDate <
    today
  ) {
    return "OVERDUE";
  }


  if (
    paid >
    0
  ) {
    return "PARTIAL";
  }


  return "PENDING";
}


/* ======================================================
   VALIDATE TENANT
====================================================== */

async function validateTenant(
  dbClient,
  tenantId,
  ownerId
) {
  const tenant =
    await findTenantForPayment(
      dbClient,
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


  /*
   * Preserve current payment behavior.
   *
   * Archived tenants cannot receive new
   * payments.
   */
  if (
    tenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Payment cannot be recorded for an archived tenant"
    );
  }


  return tenant;
}


/* ======================================================
   PREPARE OPTIONAL NOTICE PERIOD
====================================================== */

function prepareNoticePeriod(
  tenant,
  data
) {
  if (
    data.markNoticePeriod !==
    true
  ) {
    return null;
  }


  if (
    tenant.status ===
    "NOTICE_PERIOD"
  ) {
    throw new Error(
      "Tenant is already in notice period"
    );
  }


  if (
    tenant.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "Only an active tenant can be moved to notice period"
    );
  }


  /*
   * The payment date becomes the notice
   * given date.
   *
   * This keeps the future Record Payment
   * form simple:
   *
   * ☑ Mark tenant as Notice Period
   */
  const noticeGivenDate =
    data.paymentDate;


  if (
    noticeGivenDate <
    tenant.dateOfJoining
  ) {
    throw new Error(
      "Notice date cannot be before joining date"
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
    rentCycleDay <
      1 ||
    rentCycleDay >
      31
  ) {
    throw new Error(
      "Tenant has an invalid rent cycle day"
    );
  }


  const plannedVacatingDate =
    calculatePlannedVacatingDate(
      noticeGivenDate,
      rentCycleDay
    );


  return {
    noticeGivenDate,
    plannedVacatingDate,
    rentCycleDay,
  };
}


/* ======================================================
   APPLY OPTIONAL NOTICE PERIOD
====================================================== */

async function applyNoticePeriod(
  tx,
  tenant,
  ownerId,
  notice
) {
  if (
    !notice
  ) {
    return null;
  }


  const updatedTenant =
    await startTenantNoticePeriod(
      tx,
      tenant.id,
      ownerId,
      {
        noticeGivenDate:
          notice.noticeGivenDate,

        plannedVacatingDate:
          notice.plannedVacatingDate,
      }
    );


  if (
    !updatedTenant
  ) {
    throw new Error(
      "Failed to start tenant notice period"
    );
  }


  return {
    tenant:
      updatedTenant,

    noticeGivenDate:
      notice.noticeGivenDate,

    plannedVacatingDate:
      notice.plannedVacatingDate,

    rentCycleDay:
      notice.rentCycleDay,
  };
}


/* ======================================================
   SINGLE BILL PAYMENT
====================================================== */

async function createSingleBillPayment(
  data
) {
  return await db.transaction(
    async (
      tx
    ) => {
      /* ==================================================
         VALIDATE TENANT INSIDE TRANSACTION
      ================================================== */

      const tenant =
        await validateTenant(
          tx,
          data.tenantId,
          data.ownerId
        );


      const notice =
        prepareNoticePeriod(
          tenant,
          data
        );


      /* ==================================================
         LOAD + VALIDATE BILL
      ================================================== */

      const bill =
        await findRentBillForPayment(
          tx,
          data.rentBillId,
          data.tenantId,
          data.ownerId
        );


      if (
        !bill
      ) {
        throw new Error(
          "Rent bill not found"
        );
      }


      const paymentAmount =
        roundMoney(
          data.amount
        );


      const currentPaid =
        Number(
          bill.amountPaid
        );


      const amountDue =
        Number(
          bill.amountDue
        );


      const currentBalance =
        Number(
          bill.balanceAmount
        );


      if (
        currentBalance <=
          0 ||
        currentPaid >=
          amountDue ||
        bill.status ===
          "PAID"
      ) {
        throw new Error(
          "Rent bill is already fully paid"
        );
      }


      if (
        paymentAmount >
        roundMoney(
          currentBalance
        )
      ) {
        throw new Error(
          `Payment amount cannot exceed remaining balance of ${currentBalance.toFixed(
            2
          )}`
        );
      }


      /* ==================================================
         CALCULATE UPDATED BILL
      ================================================== */

      const newAmountPaid =
        roundMoney(
          currentPaid +
            paymentAmount
        );


      const newBalance =
        Math.max(
          roundMoney(
            amountDue -
              newAmountPaid
          ),
          0
        );


      const newStatus =
        calculateBillStatus({
          amountDue,

          amountPaid:
            newAmountPaid,

          dueDate:
            bill.dueDate,
        });


      /* ==================================================
         CREATE PAYMENT
      ================================================== */

      const payment =
        await createPayment(
          tx,
          {
            id:
              crypto.randomUUID(),

            tenantId:
              data.tenantId,

            rentBillId:
              bill.id,

            amount:
              String(
                paymentAmount
              ),

            paymentDate:
              data.paymentDate,

            mode:
              data.mode,

            notes:
              data.notes?.trim() ||
              null,
          }
        );


      /* ==================================================
         UPDATE RENT BILL
      ================================================== */

      const updatedBill =
        await updateRentBillAfterPayment(
          tx,
          bill.id,
          {
            amountPaid:
              String(
                newAmountPaid
              ),

            balanceAmount:
              String(
                newBalance
              ),

            status:
              newStatus,
          }
        );


      /* ==================================================
         OPTIONAL NOTICE PERIOD
      ================================================== */

      const noticeResult =
        await applyNoticePeriod(
          tx,
          tenant,
          data.ownerId,
          notice
        );


      /*
       * Payment, bill update and notice
       * update are all in the SAME
       * transaction.
       *
       * Any failure rolls back everything.
       */
      return {
        payment,

        rentBill:
          updatedBill,

        paymentType:
          "SINGLE_BILL",

        notice:
          noticeResult,
      };
    }
  );
}


/* ======================================================
   MULTIPLE BILL PAYMENT
====================================================== */

async function createMultiBillPayment(
  data
) {
  const allocations =
    data.allocations.map(
      (
        allocation
      ) => ({
        rentBillId:
          allocation.rentBillId,

        amount:
          roundMoney(
            allocation.amount
          ),
      })
    );


  const totalPaymentAmount =
    roundMoney(
      data.amount
    );


  const totalAllocated =
    roundMoney(
      allocations.reduce(
        (
          total,
          allocation
        ) =>
          total +
          allocation.amount,
        0
      )
    );


  if (
    totalAllocated !==
    totalPaymentAmount
  ) {
    throw new Error(
      "Allocated amount must equal total payment amount"
    );
  }


  return await db.transaction(
    async (
      tx
    ) => {
      /* ==================================================
         VALIDATE TENANT INSIDE TRANSACTION
      ================================================== */

      const tenant =
        await validateTenant(
          tx,
          data.tenantId,
          data.ownerId
        );


      const notice =
        prepareNoticePeriod(
          tenant,
          data
        );


      /* ==================================================
         VALIDATE ALL BILLS FIRST
      ================================================== */

      const validatedItems =
        [];


      for (
        const allocation of
        allocations
      ) {
        const bill =
          await findRentBillForPayment(
            tx,
            allocation.rentBillId,
            data.tenantId,
            data.ownerId
          );


        if (
          !bill
        ) {
          throw new Error(
            "Rent bill not found"
          );
        }


        const amountDue =
          Number(
            bill.amountDue
          );


        const currentPaid =
          Number(
            bill.amountPaid
          );


        const currentBalance =
          Number(
            bill.balanceAmount
          );


        if (
          currentBalance <=
            0 ||
          currentPaid >=
            amountDue ||
          bill.status ===
            "PAID"
        ) {
          throw new Error(
            "One of the selected rent bills is already fully paid"
          );
        }


        if (
          allocation.amount >
          roundMoney(
            currentBalance
          )
        ) {
          throw new Error(
            `Allocation for ${bill.billingPeriodStart} cannot exceed remaining balance of ${currentBalance.toFixed(
              2
            )}`
          );
        }


        validatedItems.push({
          bill,
          allocation,
        });
      }


      const createdPayments =
        [];


      const updatedBills =
        [];


      /* ==================================================
         CREATE ALLOCATED PAYMENTS
      ================================================== */

      for (
        const item of
        validatedItems
      ) {
        const {
          bill,
          allocation,
        } =
          item;


        const amountDue =
          Number(
            bill.amountDue
          );


        const currentPaid =
          Number(
            bill.amountPaid
          );


        const newAmountPaid =
          roundMoney(
            currentPaid +
              allocation.amount
          );


        const newBalance =
          Math.max(
            roundMoney(
              amountDue -
                newAmountPaid
            ),
            0
          );


        const newStatus =
          calculateBillStatus({
            amountDue,

            amountPaid:
              newAmountPaid,

            dueDate:
              bill.dueDate,
          });


        const payment =
          await createPayment(
            tx,
            {
              id:
                crypto.randomUUID(),

              tenantId:
                data.tenantId,

              rentBillId:
                bill.id,

              amount:
                String(
                  allocation.amount
                ),

              paymentDate:
                data.paymentDate,

              mode:
                data.mode,

              notes:
                data.notes?.trim() ||
                null,
            }
          );


        const updatedBill =
          await updateRentBillAfterPayment(
            tx,
            bill.id,
            {
              amountPaid:
                String(
                  newAmountPaid
                ),

              balanceAmount:
                String(
                  newBalance
                ),

              status:
                newStatus,
            }
          );


        createdPayments.push(
          payment
        );


        updatedBills.push(
          updatedBill
        );
      }


      /* ==================================================
         OPTIONAL NOTICE PERIOD
      ================================================== */

      const noticeResult =
        await applyNoticePeriod(
          tx,
          tenant,
          data.ownerId,
          notice
        );


      return {
        tenantId:
          data.tenantId,

        amount:
          String(
            totalPaymentAmount
          ),

        paymentDate:
          data.paymentDate,

        mode:
          data.mode,

        notes:
          data.notes?.trim() ||
          null,

        paymentType:
          "MULTI_BILL",

        payments:
          createdPayments,

        rentBills:
          updatedBills,

        notice:
          noticeResult,
      };
    }
  );
}


/* ======================================================
   CREATE PAYMENT
====================================================== */

export async function createPaymentService(
  data
) {
  const hasMultipleAllocations =
    Array.isArray(
      data.allocations
    ) &&
    data.allocations.length >
      0;


  if (
    hasMultipleAllocations
  ) {
    return await createMultiBillPayment(
      data
    );
  }


  return await createSingleBillPayment(
    data
  );
}


/* ======================================================
   GET ALL PAYMENTS
====================================================== */

export async function getPaymentsService(
  ownerId
) {
  if (
    !ownerId
  ) {
    throw new Error(
      "Owner ID is required"
    );
  }


  return await findPaymentsByOwner(
    db,
    ownerId
  );
}


/* ======================================================
   GET PAYMENT BY ID
====================================================== */

export async function getPaymentByIdService(
  paymentId,
  ownerId
) {
  if (
    !paymentId
  ) {
    throw new Error(
      "Payment ID is required"
    );
  }


  if (
    !ownerId
  ) {
    throw new Error(
      "Owner ID is required"
    );
  }


  return await findPaymentById(
    db,
    paymentId,
    ownerId
  );
}


/* ======================================================
   GET TENANT PAYMENTS
====================================================== */

export async function getTenantPaymentsService(
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
    await findTenantForPayment(
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


  return await findPaymentsByTenant(
    db,
    tenantId,
    ownerId
  );
}