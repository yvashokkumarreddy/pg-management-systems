import {
  db,
} from "@/db";

import {
  findDepositByTenant,
  findTenantForDeposit,
  updateDeposit,
} from "./deposit.repository.js";


function normalizeMoney(
  value
) {
  return Number(
    value
  ).toFixed(2);
}


export async function getTenantDepositService(
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
    await findTenantForDeposit(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    throw new Error(
      "Tenant not found"
    );
  }

  const deposit =
    await findDepositByTenant(
      db,
      tenantId
    );

  if (!deposit) {
    throw new Error(
      "Deposit not found"
    );
  }

  return deposit;
}


export async function updateTenantDepositService(
  tenantId,
  ownerId,
  data
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
    await findTenantForDeposit(
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
   * We allow deposit updates even
   * for archived tenants.
   *
   * Example:
   * owner settles/refunds deposit
   * after tenant leaves.
   */

  const deposit =
    await findDepositByTenant(
      db,
      tenantId
    );

  if (!deposit) {
    throw new Error(
      "Deposit not found"
    );
  }

  const updateData = {};

  if (
    data.advanceAmount !==
    undefined
  ) {
    updateData.advanceAmount =
      normalizeMoney(
        data.advanceAmount
      );
  }

  if (
    data.maintenanceAmount !==
    undefined
  ) {
    updateData.maintenanceAmount =
      normalizeMoney(
        data.maintenanceAmount
      );
  }

  if (
    data.refundableAmount !==
    undefined
  ) {
    updateData.refundableAmount =
      normalizeMoney(
        data.refundableAmount
      );
  }

  return await updateDeposit(
    db,
    deposit.id,
    updateData
  );
}