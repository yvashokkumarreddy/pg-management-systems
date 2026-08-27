import prisma from "@/lib/prisma";

export async function findDocumentsByTenant(tenantId) {
  return prisma.tenantDocument.findMany({
    where: { tenantId },
    orderBy: { uploadedAt: "desc" }
  });
}
