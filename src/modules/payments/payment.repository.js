import prisma from "@/lib/prisma";

export async function createPayment(data) {
  return prisma.payment.create({ data });
}

export async function findPaymentById(paymentId) {
  return prisma.payment.findUnique({
    where: { id: paymentId }
  });
}
