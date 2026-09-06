const VALID_RENT_STATUSES = [
  "PENDING",
  "PARTIAL",
  "PAID",
  "OVERDUE",
];


export function validateRentStatusFilter(
  status
) {
  if (!status) {
    return {
      isValid: true,
      error: null,
    };
  }

  if (
    !VALID_RENT_STATUSES.includes(
      status
    )
  ) {
    return {
      isValid: false,
      error:
        "Status must be PENDING, PARTIAL, PAID, or OVERDUE",
    };
  }

  return {
    isValid: true,
    error: null,
  };
}