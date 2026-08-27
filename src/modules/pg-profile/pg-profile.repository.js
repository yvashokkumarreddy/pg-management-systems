import prisma from "@/lib/prisma";

export async function findProfileByOwner(ownerId) {
  return prisma.pGProfile.findUnique({
    where: { ownerId },
    include: { photos: true }
  });
}
