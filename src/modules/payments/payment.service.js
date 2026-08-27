import * as paymentRepository from "./payment.repository";

export async function createPayment(data) {
  return paymentRepository.createPayment(data);
}

export async function getPayment(paymentId) {
  return paymentRepository.findPaymentById(paymentId);
}
