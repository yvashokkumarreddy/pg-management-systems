export function calculateNextRentCycle(joiningDate, currentCycleStart) {
  const start = new Date(currentCycleStart || joiningDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);

  const dueDate = new Date(end);
  dueDate.setDate(dueDate.getDate() + 1);

  return {
    billingPeriodStart: start,
    billingPeriodEnd: end,
    dueDate
  };
}
