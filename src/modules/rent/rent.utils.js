function parseDateString(
  dateString,
  errorMessage = "Invalid date"
) {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    throw new Error(
      errorMessage
    );
  }

  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  if (
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    throw new Error(
      errorMessage
    );
  }

  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();

  if (
    day >
    daysInMonth
  ) {
    throw new Error(
      errorMessage
    );
  }

  return {
    year,
    month,
    day,
  };
}


function getDaysInMonth(
  year,
  month
) {
  return new Date(
    year,
    month,
    0
  ).getDate();
}


function formatDate({
  year,
  month,
  day,
}) {
  return [
    String(year).padStart(
      4,
      "0"
    ),
    String(month).padStart(
      2,
      "0"
    ),
    String(day).padStart(
      2,
      "0"
    ),
  ].join("-");
}


function getNextMonth({
  year,
  month,
}) {
  if (month === 12) {
    return {
      year:
        year + 1,
      month:
        1,
    };
  }

  return {
    year,
    month:
      month + 1,
  };
}


function getPreviousDay({
  year,
  month,
  day,
}) {
  if (day > 1) {
    return {
      year,
      month,
      day:
        day - 1,
    };
  }

  let previousYear =
    year;

  let previousMonth =
    month - 1;

  if (
    previousMonth === 0
  ) {
    previousMonth = 12;
    previousYear -= 1;
  }

  return {
    year:
      previousYear,

    month:
      previousMonth,

    day:
      getDaysInMonth(
        previousYear,
        previousMonth
      ),
  };
}


function getTodayDateString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


export function calculateRentCycle(
  startDate
) {
  /*
   * Business date only.
   *
   * Expected:
   * YYYY-MM-DD
   *
   * Do not convert this value with:
   * new Date(startDate)
   */
  const start =
    parseDateString(
      startDate,
      "Invalid billing start date"
    );


  /*
   * Next billing date uses the
   * same calendar day in the
   * following month.
   */
  const nextMonth =
    getNextMonth(
      start
    );


  /*
   * Clamp the day for shorter
   * months.
   *
   * Example:
   *
   * Jan 31 -> Feb 28
   * Jan 31 -> Feb 29 leap year
   */
  const lastDayOfNextMonth =
    getDaysInMonth(
      nextMonth.year,
      nextMonth.month
    );


  const nextBillingDate =
    {
      year:
        nextMonth.year,

      month:
        nextMonth.month,

      day:
        Math.min(
          start.day,
          lastDayOfNextMonth
        ),
    };


  /*
   * Billing period ends one day
   * before the next billing date.
   */
  const billingPeriodEnd =
    getPreviousDay(
      nextBillingDate
    );


  return {
    billingPeriodStart:
      formatDate(
        start
      ),

    billingPeriodEnd:
      formatDate(
        billingPeriodEnd
      ),

    dueDate:
      formatDate(
        nextBillingDate
      ),
  };
}


export function calculateNextRentCycle(
  previousBill
) {
  if (
    !previousBill?.dueDate
  ) {
    throw new Error(
      "Previous bill due date is required"
    );
  }

  /*
   * Example:
   *
   * Previous:
   * 2026-08-17
   *     →
   * 2026-09-16
   *
   * Due:
   * 2026-09-17
   *
   * Next:
   * 2026-09-17
   *     →
   * 2026-10-16
   *
   * Due:
   * 2026-10-17
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
  const due =
    Number(
      amountDue
    );

  const paid =
    Number(
      amountPaid
    );


  if (paid >= due) {
    return "PAID";
  }


  /*
   * dueDate is YYYY-MM-DD.
   *
   * Validate it but do not convert
   * it to a JavaScript Date.
   */
  parseDateString(
    dueDate,
    "Invalid rent due date"
  );


  const today =
    getTodayDateString();


  /*
   * YYYY-MM-DD strings can be compared
   * directly because the format is
   * lexicographically sortable.
   *
   * Due today:
   * not overdue.
   *
   * Due before today:
   * overdue.
   */
  if (
    dueDate <
    today
  ) {
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
    Number(
      amountDue
    ) -
    Number(
      amountPaid
    );

  return Math.max(
    balance,
    0
  );
}