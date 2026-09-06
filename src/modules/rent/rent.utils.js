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


function createCycleDate(
  year,
  month,
  rentCycleDay
) {
  return {
    year,
    month,

    day:
      Math.min(
        rentCycleDay,
        getDaysInMonth(
          year,
          month
        )
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


export function validateRentCycleDay(
  value
) {
  const rentCycleDay =
    Number(
      value
    );


  if (
    !Number.isInteger(
      rentCycleDay
    ) ||
    rentCycleDay < 1 ||
    rentCycleDay > 31
  ) {
    throw new Error(
      "Rent cycle day must be between 1 and 31"
    );
  }


  return rentCycleDay;
}


export function calculateRentCycle(
  startDate,
  rentCycleDay = null
) {
  const start =
    parseDateString(
      startDate,
      "Invalid billing start date"
    );


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


export function calculateNextRentCycle(
  previousBill,
  rentCycleDay
) {
  if (
    !previousBill?.dueDate
  ) {
    throw new Error(
      "Previous bill due date is required"
    );
  }


  /*
   * Previous dueDate becomes the next
   * billingPeriodStart.
   *
   * rentCycleDay remains the permanent
   * anchor.
   */
  return calculateRentCycle(
    previousBill.dueDate,
    rentCycleDay
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


  if (
    paid >= due
  ) {
    return "PAID";
  }


  parseDateString(
    dueDate,
    "Invalid rent due date"
  );


  const today =
    getTodayDateString();


  if (
    dueDate <
    today
  ) {
    return "OVERDUE";
  }


  if (
    paid > 0
  ) {
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