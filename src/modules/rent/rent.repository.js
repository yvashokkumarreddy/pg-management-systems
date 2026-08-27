import prisma from "@/lib/prisma";

export async function findTenantBillings(tenantId) {
  return prisma.rentBilling.findMany({
    where: { tenantId },
    include: { payments: true },
    orderBy: { billingPeriodStart: "desc" }
  });
}
