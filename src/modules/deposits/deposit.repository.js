import {
  and,
  eq,
} from "drizzle-orm";

import {
  tenantDeposits,
  tenants,
} from "@/db/schema";


export async function findTenantForDeposit(
  dbClient,
  tenantId,
  ownerId
) {
  const result =
    await dbClient
      .select({
        id:
          tenants.id,

        ownerId:
          tenants.ownerId,

        fullName:
          tenants.fullName,

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


export async function findDepositByTenant(
  dbClient,
  tenantId
) {
  const result =
    await dbClient
      .select({
        id:
          tenantDeposits.id,

        tenantId:
          tenantDeposits.tenantId,

        advanceAmount:
          tenantDeposits.advanceAmount,

        maintenanceAmount:
          tenantDeposits.maintenanceAmount,

        refundableAmount:
          tenantDeposits.refundableAmount,

        createdAt:
          tenantDeposits.createdAt,

        updatedAt:
          tenantDeposits.updatedAt,
      })
      .from(tenantDeposits)
      .where(
        eq(
          tenantDeposits.tenantId,
          tenantId
        )
      )
      .limit(1);

  return result[0] ?? null;
}


export async function updateDeposit(
  dbClient,
  depositId,
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
          tenantDeposits.id,
          depositId
        )
      )
      .returning();

  return result[0] ?? null;
}