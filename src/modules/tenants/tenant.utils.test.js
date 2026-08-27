import { calculateRentCycle } from "./tenant.utils.js";

const result = calculateRentCycle(
  "2026-09-17T00:00:00.000Z"
);

console.log({
  start: result.billingPeriodStart.toISOString(),
  end: result.billingPeriodEnd.toISOString(),
  due: result.dueDate.toISOString(),
});