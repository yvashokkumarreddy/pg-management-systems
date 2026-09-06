export function validateUpdateDeposit(data) {
  const errors = {};

  const allowedFields = [
    "advanceAmount",
    "maintenanceAmount",
    "refundableAmount",
  ];

  const providedFields =
    allowedFields.filter(
      (field) =>
        data[field] !== undefined
    );

  if (providedFields.length === 0) {
    errors.deposit =
      "At least one deposit field is required";
  }

  for (const field of providedFields) {
    const value =
      Number(data[field]);

    if (
      Number.isNaN(value) ||
      value < 0
    ) {
      errors[field] =
        `${field} must be 0 or greater`;
    }
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}