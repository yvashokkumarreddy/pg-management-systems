export function validateCreateTenant(data) {
  const errors = {};

  if (
    !data.fullName ||
    !String(data.fullName).trim()
  ) {
    errors.fullName =
      "Full name is required";
  }

  if (
    !data.mobile ||
    !String(data.mobile).trim()
  ) {
    errors.mobile =
      "Mobile number is required";
  }

  if (!data.roomId) {
    errors.roomId =
      "Room is required";
  }

  if (!data.dateOfJoining) {
    errors.dateOfJoining =
      "Date of joining is required";
  }

  if (
    data.monthlyRent === undefined ||
    data.monthlyRent === null ||
    data.monthlyRent === "" ||
    Number(data.monthlyRent) <= 0
  ) {
    errors.monthlyRent =
      "Monthly rent must be greater than 0";
  }

  if (
    data.advanceAmount !== undefined &&
    data.advanceAmount !== null &&
    data.advanceAmount !== "" &&
    Number(data.advanceAmount) < 0
  ) {
    errors.advanceAmount =
      "Deposit received cannot be negative";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}


export function validateUpdateTenant(data) {
  const errors = {};

  if (
    data.fullName !== undefined &&
    !String(data.fullName).trim()
  ) {
    errors.fullName =
      "Full name cannot be empty";
  }

  if (
    data.mobile !== undefined &&
    !String(data.mobile).trim()
  ) {
    errors.mobile =
      "Mobile number cannot be empty";
  }

  if (
    data.roomId !== undefined &&
    !data.roomId
  ) {
    errors.roomId =
      "Room is required";
  }

  if (
    data.dateOfJoining !== undefined &&
    !data.dateOfJoining
  ) {
    errors.dateOfJoining =
      "Date of joining is required";
  }

  if (
    data.monthlyRent !== undefined &&
    Number(data.monthlyRent) <= 0
  ) {
    errors.monthlyRent =
      "Monthly rent must be greater than 0";
  }

  if (
    data.advanceAmount !== undefined &&
    Number(data.advanceAmount) < 0
  ) {
    errors.advanceAmount =
      "Advance amount cannot be negative";
  }

  if (
    data.maintenanceAmount !== undefined &&
    Number(data.maintenanceAmount) < 0
  ) {
    errors.maintenanceAmount =
      "Maintenance amount cannot be negative";
  }

  if (
    data.refundableAmount !== undefined &&
    Number(data.refundableAmount) < 0
  ) {
    errors.refundableAmount =
      "Refundable amount cannot be negative";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}