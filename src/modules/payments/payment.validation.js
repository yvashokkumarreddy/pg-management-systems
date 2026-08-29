const VALID_PAYMENT_MODES = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "OTHER",
];


export function validateCreatePayment(data) {
  const errors = {};

  if (!data.rentBillId) {
    errors.rentBillId =
      "Rent bill ID is required";
  }

  if (
    data.amount === undefined ||
    data.amount === null ||
    data.amount === "" ||
    Number(data.amount) <= 0
  ) {
    errors.amount =
      "Payment amount must be greater than 0";
  }

  const validModes = [
    "CASH",
    "UPI",
    "BANK_TRANSFER",
    "OTHER",
  ];

  if (
    !data.mode ||
    !validModes.includes(data.mode)
  ) {
    errors.mode =
      "Payment mode must be CASH, UPI, BANK_TRANSFER, or OTHER";
  }

  if (!data.paymentDate) {
    errors.paymentDate =
      "Payment date is required";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}