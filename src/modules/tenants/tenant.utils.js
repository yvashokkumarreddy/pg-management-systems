function parseDateString(
  dateString,
  errorMessage =
    "Invalid date"
) {
  if (
    typeof dateString !==
      "string" ||
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
    getDaysInMonth(
      year,
      month
    );


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
  if (
    month === 12
  ) {
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
  if (
    day > 1
  ) {
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
    previousMonth =
      12;

    previousYear -=
      1;
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


function compareCalendarDates(
  first,
  second
) {
  const firstValue =
    formatDate(first);

  const secondValue =
    formatDate(second);


  if (
    firstValue <
    secondValue
  ) {
    return -1;
  }


  if (
    firstValue >
    secondValue
  ) {
    return 1;
  }


  return 0;
}


function createCycleDate(
  year,
  month,
  rentCycleDay
) {
  const daysInMonth =
    getDaysInMonth(
      year,
      month
    );


  return {
    year,
    month,

    day:
      Math.min(
        rentCycleDay,
        daysInMonth
      ),
  };
}


/* ======================================================
   RENT CYCLE DAY
====================================================== */

export function getRentCycleDayFromDate(
  dateString
) {
  const parsed =
    parseDateString(
      dateString,
      "Invalid date"
    );


  return parsed.day;
}


export function validateRentCycleDay(
  rentCycleDay
) {
  const parsed =
    Number(
      rentCycleDay
    );


  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed < 1 ||
    parsed > 31
  ) {
    throw new Error(
      "Rent cycle day must be between 1 and 31"
    );
  }


  return parsed;
}


/* ======================================================
   NORMAL RENT CYCLE
====================================================== */

export function calculateRentCycle(
  startDate,
  rentCycleDay = null
) {
  /*
   * startDate is a calendar date:
   *
   * YYYY-MM-DD
   *
   * Never use:
   *
   * new Date(startDate)
   *
   * because YYYY-MM-DD may be interpreted
   * using UTC.
   */
  const start =
    parseDateString(
      startDate,
      "Invalid billing start date"
    );


  /*
   * If an anchor is not supplied,
   * preserve the old behaviour and use
   * the start date's calendar day.
   */
  const cycleDay =
    rentCycleDay ===
      null ||
    rentCycleDay ===
      undefined
      ? start.day
      : validateRentCycleDay(
          rentCycleDay
        );


  const nextMonth =
    getNextMonth(
      start
    );


  /*
   * The recurring anchor is preserved.
   *
   * Example:
   *
   * rentCycleDay = 31
   *
   * 31 Jan -> 28 Feb
   * 28 Feb -> 31 Mar
   *
   * The cycle does NOT permanently drift
   * to the 28th.
   */
  const nextBillingDate =
    createCycleDate(
      nextMonth.year,
      nextMonth.month,
      cycleDay
    );


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


/* ======================================================
   TRANSITION RENT CYCLE
====================================================== */

export function calculateTransitionRentCycle(
  transitionStartDate,
  newRentCycleDay
) {
  const start =
    parseDateString(
      transitionStartDate,
      "Invalid transition start date"
    );


  const cycleDay =
    validateRentCycleDay(
      newRentCycleDay
    );


  /*
   * First try the requested cycle day
   * in the same calendar month.
   *
   * Example:
   *
   * Start: 15 Oct
   * New day: 20
   *
   * Transition:
   * 15 Oct -> 19 Oct
   * New regular cycle begins 20 Oct.
   */
  let nextCycleDate =
    createCycleDate(
      start.year,
      start.month,
      cycleDay
    );


  /*
   * If that cycle boundary is on or
   * before the transition start,
   * move to the next month.
   *
   * Example:
   *
   * Start: 15 Oct
   * New day: 3
   *
   * Same-month 03 Oct has already passed,
   * therefore next boundary is 03 Nov.
   */
  if (
    compareCalendarDates(
      nextCycleDate,
      start
    ) <= 0
  ) {
    const nextMonth =
      getNextMonth(
        start
      );


    nextCycleDate =
      createCycleDate(
        nextMonth.year,
        nextMonth.month,
        cycleDay
      );
  }


  const billingPeriodEnd =
    getPreviousDay(
      nextCycleDate
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
        nextCycleDate
      ),

    nextRegularCycleStart:
      formatDate(
        nextCycleDate
      ),
  };
}