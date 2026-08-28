import crypto from "crypto";

import { db } from "@/db";

import {
  createPayment,
  findPaymentById,
  findPaymentsByOwner,
  findPaymentsByTenant,
  findRentBillForPayment,
  findTenantForPayment,
  updateRentBillAfterPayment,
} from "./payment.repository.js";


function calculateBillStatus({
  amountDue,
  amountPaid,
  dueDate,
}) {
  const due =
    Number(amountDue);

  const paid =
    Number(amountPaid);

  if (paid >= due) {
    return "PAID";
  }

  const dueDateValue =
    new Date(dueDate);

  const now =
    new Date();

  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const billDueDate =
    new Date(
      dueDateValue.getFullYear(),
      dueDateValue.getMonth(),
      dueDateValue.getDate()
    );

  if (
    billDueDate < today
  ) {
    return "OVERDUE";
  }

  if (paid > 0) {
    return "PARTIAL";
  }

  return "PENDING";
}


export async function createPaymentService(
  data
) {
  const tenant =
    await findTenantForPayment(
      db,
      data.tenantId,
      data.ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }

  /*
   * Archived tenants retain payment
   * history, but new payments should
   * normally not be added after archive.
   */
  if (
    tenant.status === "ARCHIVED"
  ) {
    throw new Error(
      "Payment cannot be recorded for an archived tenant"
    );
  }

  return await db.transaction(
    async (tx) => {
      const bill =
        await findRentBillForPayment(
          tx,
          data.rentBillId,
          data.tenantId,
          data.ownerId
        );

      if (!bill) {
        throw new Error(
          "Rent bill not found"
        );
      }

      const paymentAmount =
        Number(data.amount);

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
        currentBalance <= 0 ||
        currentPaid >= amountDue ||
        bill.status === "PAID"
      ) {
        throw new Error(
          "Rent bill is already fully paid"
        );
      }

      if (
        paymentAmount >
        currentBalance
      ) {
        throw new Error(
          `Payment amount cannot exceed remaining balance of ${currentBalance.toFixed(
            2
          )}`
        );
      }

      const newAmountPaid =
        currentPaid +
        paymentAmount;

      const newBalance =
        Math.max(
          amountDue -
            newAmountPaid,
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
              data.rentBillId,

            amount:
              String(
                paymentAmount
              ),

            paymentDate:
              new Date(
                data.paymentDate
              ),

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

      return {
        payment,
        rentBill:
          updatedBill,
      };
    }
  );
}


export async function getPaymentsService(
  ownerId
) {
  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  return await findPaymentsByOwner(
    db,
    ownerId
  );
}


export async function getPaymentByIdService(
  paymentId,
  ownerId
) {
  if (!paymentId) {
    throw new Error(
      "Payment ID is required"
    );
  }

  if (!ownerId) {
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


export async function getTenantPaymentsService(
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
    await findTenantForPayment(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }

  /*
   * Archived tenants are allowed here.
   *
   * We need to preserve and display
   * historical payment information.
   */
  return await findPaymentsByTenant(
    db,
    tenantId,
    ownerId
  );
}