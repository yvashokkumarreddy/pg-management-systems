const VALID_PAYMENT_MODES = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "OTHER",
];


/* ======================================================
   HELPERS
====================================================== */

function isValidDateString(
  value
) {
  if (
    typeof value !==
      "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }


  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);


  if (
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }


  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();


  return (
    day <=
    daysInMonth
  );
}


function roundMoney(
  value
) {
  return (
    Math.round(
      Number(
        value
      ) *
        100
    ) /
    100
  );
}


/* ======================================================
   VALIDATE CREATE PAYMENT
====================================================== */

export function validateCreatePayment(
  data
) {
  const errors =
    {};


  const paymentAmount =
    Number(
      data.amount
    );


  /* ====================================================
     TENANT
  ==================================================== */

  if (
    !data.tenantId ||
    typeof data.tenantId !==
      "string"
  ) {
    errors.tenantId =
      "Tenant ID is required";
  }


  /* ====================================================
     AMOUNT
  ==================================================== */

  if (
    data.amount ===
      undefined ||
    data.amount ===
      null ||
    data.amount ===
      "" ||
    !Number.isFinite(
      paymentAmount
    ) ||
    paymentAmount <=
      0
  ) {
    errors.amount =
      "Payment amount must be greater than 0";
  }


  /* ====================================================
     PAYMENT MODE
  ==================================================== */

  if (
    !data.mode ||
    !VALID_PAYMENT_MODES.includes(
      data.mode
    )
  ) {
    errors.mode =
      "Payment mode must be CASH, UPI, BANK_TRANSFER, or OTHER";
  }


  /* ====================================================
     PAYMENT DATE
  ==================================================== */

  if (
    !data.paymentDate
  ) {
    errors.paymentDate =
      "Payment date is required";
  } else if (
    !isValidDateString(
      data.paymentDate
    )
  ) {
    errors.paymentDate =
      "Invalid payment date";
  }


  /* ====================================================
     NOTES
  ==================================================== */

  if (
    data.notes !==
      undefined &&
    data.notes !==
      null &&
    typeof data.notes !==
      "string"
  ) {
    errors.notes =
      "Notes must be valid";
  }


  if (
    typeof data.notes ===
      "string" &&
    data.notes.length >
      500
  ) {
    errors.notes =
      "Notes cannot exceed 500 characters";
  }


  /* ====================================================
     OPTIONAL NOTICE PERIOD
  ==================================================== */

  /*
   * Future frontend checkbox:
   *
   * markNoticePeriod: true
   *
   * plannedVacatingDate is NOT supplied
   * by the client.
   *
   * paymentDate becomes the notice date
   * and the backend calculates the valid
   * vacating boundary.
   */
  if (
    data.markNoticePeriod !==
      undefined &&
    typeof data.markNoticePeriod !==
      "boolean"
  ) {
    errors.markNoticePeriod =
      "Mark notice period must be true or false";
  }


  /* ====================================================
     DETERMINE SINGLE VS MULTI BILL
  ==================================================== */

  const hasAllocations =
    Array.isArray(
      data.allocations
    ) &&
    data.allocations.length >
      0;


  /* ====================================================
     MULTI-BILL PAYMENT
  ==================================================== */

  if (
    hasAllocations
  ) {
    const billIds =
      new Set();


    let totalAllocated =
      0;


    for (
      const allocation of
      data.allocations
    ) {
      if (
        !allocation ||
        typeof allocation !==
          "object"
      ) {
        errors.allocations =
          "Invalid payment allocation";

        break;
      }


      if (
        !allocation.rentBillId ||
        typeof allocation.rentBillId !==
          "string"
      ) {
        errors.allocations =
          "Every allocation must contain a rent bill ID";

        break;
      }


      if (
        billIds.has(
          allocation.rentBillId
        )
      ) {
        errors.allocations =
          "The same rent bill cannot be allocated more than once";

        break;
      }


      billIds.add(
        allocation.rentBillId
      );


      const allocationAmount =
        Number(
          allocation.amount
        );


      if (
        !Number.isFinite(
          allocationAmount
        ) ||
        allocationAmount <=
          0
      ) {
        errors.allocations =
          "Every allocation amount must be greater than 0";

        break;
      }


      totalAllocated +=
        allocationAmount;
    }


    if (
      !errors.allocations &&
      Number.isFinite(
        paymentAmount
      )
    ) {
      if (
        roundMoney(
          totalAllocated
        ) !==
        roundMoney(
          paymentAmount
        )
      ) {
        errors.allocations =
          "Allocated amount must equal total payment amount";
      }
    }
  }

  /* ====================================================
     SINGLE-BILL PAYMENT
  ==================================================== */

  else if (
    !data.rentBillId ||
    typeof data.rentBillId !==
      "string"
  ) {
    errors.rentBillId =
      "Rent bill ID is required";
  }


  return {
    isValid:
      Object.keys(
        errors
      ).length ===
      0,

    errors,
  };
}