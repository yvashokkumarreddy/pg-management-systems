import { z } from "zod";

export const createPaymentSchema = z.object({
  tenantId: z.string().min(1),
  rentBillingId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.coerce.date(),
  mode: z.enum(["CASH", "UPI", "BANK"]),
  notes: z.string().optional()
});
