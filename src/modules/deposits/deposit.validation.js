import { z } from "zod";

export const depositSettlementSchema = z.object({
  refundableAmount: z.number().nonnegative(),
  maintenanceDeduction: z.number().nonnegative()
});
