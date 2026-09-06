function isValidDateString(
  value
) {
  if (
    typeof value !== "string" ||
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
  ] = value
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


/* ======================================================
   CREATE TENANT
====================================================== */

export function validateCreateTenant(
  data
) {
  const errors =
    {};


  if (
    !data.fullName ||
    typeof data.fullName !==
      "string"
  ) {
    errors.fullName =
      "Full name is required";
  }


  if (
    !data.mobile ||
    typeof data.mobile !==
      "string"
  ) {
    errors.mobile =
      "Mobile number is required";
  }


  if (
    !data.dateOfJoining
  ) {
    errors.dateOfJoining =
      "Date of joining is required";
  } else if (
    !isValidDateString(
      data.dateOfJoining
    )
  ) {
    errors.dateOfJoining =
      "Invalid date of joining";
  }


  if (
    data.monthlyRent ===
      undefined ||
    data.monthlyRent ===
      null ||
    Number.isNaN(
      Number(
        data.monthlyRent
      )
    ) ||
    Number(
      data.monthlyRent
    ) <= 0
  ) {
    errors.monthlyRent =
      "Valid monthly rent is required";
  }


  if (
    !data.roomId ||
    typeof data.roomId !==
      "string"
  ) {
    errors.roomId =
      "Room ID is required";
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


/* ======================================================
   UPDATE TENANT
====================================================== */

export function validateUpdateTenant(
  data
) {
  const errors =
    {};


  if (
    data.fullName !==
      undefined &&
    (
      typeof data.fullName !==
        "string" ||
      !data.fullName.trim()
    )
  ) {
    errors.fullName =
      "Full name must be valid";
  }


  if (
    data.mobile !==
      undefined &&
    (
      typeof data.mobile !==
        "string" ||
      !data.mobile.trim()
    )
  ) {
    errors.mobile =
      "Mobile number must be valid";
  }


  if (
    data.dateOfJoining !==
      undefined &&
    !isValidDateString(
      data.dateOfJoining
    )
  ) {
    errors.dateOfJoining =
      "Invalid date of joining";
  }


  if (
    data.dateOfBirth !==
      undefined &&
    data.dateOfBirth !==
      null &&
    data.dateOfBirth !==
      "" &&
    !isValidDateString(
      data.dateOfBirth
    )
  ) {
    errors.dateOfBirth =
      "Invalid date of birth";
  }


  if (
    data.monthlyRent !==
      undefined &&
    (
      Number.isNaN(
        Number(
          data.monthlyRent
        )
      ) ||
      Number(
        data.monthlyRent
      ) <= 0
    )
  ) {
    errors.monthlyRent =
      "Monthly rent must be greater than 0";
  }


  for (
    const field of
    [
      "advanceAmount",
      "maintenanceAmount",
      "refundableAmount",
    ]
  ) {
    if (
      data[field] !==
        undefined &&
      (
        Number.isNaN(
          Number(
            data[field]
          )
        ) ||
        Number(
          data[field]
        ) < 0
      )
    ) {
      errors[field] =
        `${field} must be 0 or greater`;
    }
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


/* ======================================================
   CHANGE RENT CYCLE
====================================================== */

export function validateRentCycleChange(
  data
) {
  const errors =
    {};


  const rentCycleDay =
    Number(
      data.rentCycleDay
    );


  if (
    !Number.isInteger(
      rentCycleDay
    ) ||
    rentCycleDay < 1 ||
    rentCycleDay > 31
  ) {
    errors.rentCycleDay =
      "Rent cycle day must be between 1 and 31";
  }


  const transitionRentAmount =
    Number(
      data.transitionRentAmount
    );


  if (
    !Number.isFinite(
      transitionRentAmount
    ) ||
    transitionRentAmount <=
      0
  ) {
    errors.transitionRentAmount =
      "Transition rent amount must be greater than 0";
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


/* ======================================================
   GIVE VACATING NOTICE
====================================================== */


export function validateGiveNotice(
  data
) {
  const errors =
    {};


  /*
   * plannedVacatingDate is intentionally
   * NOT accepted from the client.
   *
   * The backend calculates it from:
   *
   * - noticeGivenDate
   * - tenant.rentCycleDay
   *
   * This prevents the frontend from
   * choosing an invalid notice boundary.
   */
  if (
    !data.noticeGivenDate
  ) {
    errors.noticeGivenDate =
      "Notice given date is required";
  } else if (
    !isValidDateString(
      data.noticeGivenDate
    )
  ) {
    errors.noticeGivenDate =
      "Invalid notice given date";
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