export function calculateRentCycle(startDate) {
  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid billing start date");
  }

  const nextBillingDate = new Date(start);

  const originalDay = start.getDate();

  nextBillingDate.setDate(1);
  nextBillingDate.setMonth(
    nextBillingDate.getMonth() + 1
  );

  const lastDayOfNextMonth = new Date(
    nextBillingDate.getFullYear(),
    nextBillingDate.getMonth() + 1,
    0
  ).getDate();

  nextBillingDate.setDate(
    Math.min(
      originalDay,
      lastDayOfNextMonth
    )
  );

  const billingPeriodEnd =
    new Date(nextBillingDate);

  billingPeriodEnd.setDate(
    billingPeriodEnd.getDate() - 1
  );

  return {
    billingPeriodStart: start,
    billingPeriodEnd,
    dueDate: nextBillingDate,
  };
}


export function calculateNextRentCycle(
  previousBill
) {
  if (!previousBill?.dueDate) {
    throw new Error(
      "Previous bill due date is required"
    );
  }

  /*
   * Example:
   *
   * Previous:
   * Aug 17 → Sep 16
   * Due: Sep 17
   *
   * Next cycle:
   * Sep 17 → Oct 16
   * Due: Oct 17
   */
  return calculateRentCycle(
    previousBill.dueDate
  );
}


export function calculateRentStatus({
  amountDue,
  amountPaid,
  dueDate,
}) {
  const due = Number(amountDue);
  const paid = Number(amountPaid);

  if (paid >= due) {
    return "PAID";
  }

  const dueDateValue =
    new Date(dueDate);

  const now = new Date();

  /*
   * Compare dates from the start of today.
   *
   * Bill becomes overdue only after
   * its due date has passed.
   */
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const billDueDate = new Date(
    dueDateValue.getFullYear(),
    dueDateValue.getMonth(),
    dueDateValue.getDate()
  );

  if (billDueDate < today) {
    return "OVERDUE";
  }

  if (paid > 0) {
    return "PARTIAL";
  }

  return "PENDING";
}


export function calculateBalance(
  amountDue,
  amountPaid
) {
  const balance =
    Number(amountDue) -
    Number(amountPaid);

  return Math.max(balance, 0);
}