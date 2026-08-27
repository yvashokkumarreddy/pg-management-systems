export function calculateRentCycle(joiningDate) {
  const start = new Date(joiningDate);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid joining date");
  }

  // Next billing date is the same calendar day
  // in the following month.
  const nextBillingDate = new Date(start);

  const originalDay = start.getDate();

  nextBillingDate.setDate(1);
  nextBillingDate.setMonth(
    nextBillingDate.getMonth() + 1
  );

  // Handle months that don't have the original day.
  const lastDayOfNextMonth = new Date(
    nextBillingDate.getFullYear(),
    nextBillingDate.getMonth() + 1,
    0
  ).getDate();

  nextBillingDate.setDate(
    Math.min(originalDay, lastDayOfNextMonth)
  );

  // Billing period ends one day before
  // the next billing date.
  const billingPeriodEnd = new Date(
    nextBillingDate
  );

  billingPeriodEnd.setDate(
    billingPeriodEnd.getDate() - 1
  );

  return {
    billingPeriodStart: start,
    billingPeriodEnd,
    dueDate: nextBillingDate,
  };
}