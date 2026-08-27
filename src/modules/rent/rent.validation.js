import { z } from "zod";

export const rentBillingSchema = z.object({
  tenantId: z.string().min(1),
  billingPeriodStart: z.coerce.date(),
  billingPeriodEnd: z.coerce.date(),
  dueDate: z.coerce.date(),
  amountDue: z.number().positive()
});
