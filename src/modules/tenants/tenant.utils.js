function parseDateString(
  dateString
) {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    throw new Error(
      "Invalid joining date"
    );
  }

  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth
  ) {
    throw new Error(
      "Invalid joining date"
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
      year: year + 1,
      month: 1,
    };
  }

  return {
    year,
    month: month + 1,
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
      day: day - 1,
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


export function calculateRentCycle(
  joiningDate
) {
  /*
   * joiningDate is a calendar date:
   *
   * YYYY-MM-DD
   *
   * Do not convert it using:
   *
   * new Date(joiningDate)
   *
   * because YYYY-MM-DD is interpreted
   * through UTC and can cause timezone
   * related date shifts.
   */
  const start =
    parseDateString(
      joiningDate
    );

  /*
   * Next billing date is the same
   * calendar day in the following
   * month.
   */
  const nextMonth =
    getNextMonth(start);

  /*
   * Clamp the billing day when the
   * following month does not contain
   * the original joining day.
   *
   * Example:
   *
   * Jan 31 -> Feb 28
   * Jan 31 -> Feb 29 in leap year
   */
  const lastDayOfNextMonth =
    getDaysInMonth(
      nextMonth.year,
      nextMonth.month
    );

  const nextBillingDate = {
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
   * Billing period ends one calendar
   * day before the next billing date.
   */
  const billingPeriodEnd =
    getPreviousDay(
      nextBillingDate
    );

  return {
    billingPeriodStart:
      formatDate(start),

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