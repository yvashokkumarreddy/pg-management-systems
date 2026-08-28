const VALID_PAYMENT_MODES = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "OTHER",
];


export function validateCreatePayment(data) {
  const errors = {};

  if (
    !data.ownerId ||
    typeof data.ownerId !== "string"
  ) {
    errors.ownerId = "Owner ID is required";
  }

  if (
    !data.tenantId ||
    typeof data.tenantId !== "string"
  ) {
    errors.tenantId = "Tenant ID is required";
  }

  if (
    !data.rentBillId ||
    typeof data.rentBillId !== "string"
  ) {
    errors.rentBillId =
      "Rent bill ID is required";
  }

  if (
    data.amount === undefined ||
    data.amount === null ||
    Number.isNaN(Number(data.amount)) ||
    Number(data.amount) <= 0
  ) {
    errors.amount =
      "Payment amount must be greater than 0";
  }

  if (!data.paymentDate) {
    errors.paymentDate =
      "Payment date is required";
  } else {
    const paymentDate =
      new Date(data.paymentDate);

    if (
      Number.isNaN(
        paymentDate.getTime()
      )
    ) {
      errors.paymentDate =
        "Invalid payment date";
    }
  }

  if (
    !data.mode ||
    !VALID_PAYMENT_MODES.includes(
      data.mode
    )
  ) {
    errors.mode =
      "Payment mode must be CASH, UPI, BANK_TRANSFER, or OTHER";
  }

  if (
    data.notes !== undefined &&
    data.notes !== null &&
    typeof data.notes !== "string"
  ) {
    errors.notes =
      "Notes must be valid";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}