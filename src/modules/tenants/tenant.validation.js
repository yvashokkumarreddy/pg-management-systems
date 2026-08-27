export function validateCreateTenant(data) {
  const errors = {};

  if (!data.fullName || typeof data.fullName !== "string") {
    errors.fullName = "Full name is required";
  }

  if (!data.mobile || typeof data.mobile !== "string") {
    errors.mobile = "Mobile number is required";
  }

  if (!data.ownerId || typeof data.ownerId !== "string") {
    errors.ownerId = "Owner ID is required";
  }

  if (!data.dateOfJoining) {
    errors.dateOfJoining = "Date of joining is required";
  } else if (Number.isNaN(new Date(data.dateOfJoining).getTime())) {
    errors.dateOfJoining = "Invalid date of joining";
  }

  if (
    data.monthlyRent === undefined ||
    data.monthlyRent === null ||
    Number.isNaN(Number(data.monthlyRent))
  ) {
    errors.monthlyRent = "Valid monthly rent is required";
  }

  if (!data.roomId || typeof data.roomId !== "string") {
    errors.roomId = "Room ID is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateUpdateTenant(data) {
  const errors = {};

  if (
    data.fullName !== undefined &&
    (typeof data.fullName !== "string" || !data.fullName.trim())
  ) {
    errors.fullName = "Full name must be valid";
  }

  if (
    data.mobile !== undefined &&
    (typeof data.mobile !== "string" || !data.mobile.trim())
  ) {
    errors.mobile = "Mobile number must be valid";
  }

  if (
    data.dateOfJoining !== undefined &&
    Number.isNaN(new Date(data.dateOfJoining).getTime())
  ) {
    errors.dateOfJoining = "Invalid date of joining";
  }

  if (
    data.monthlyRent !== undefined &&
    (
      Number.isNaN(Number(data.monthlyRent)) ||
      Number(data.monthlyRent) <= 0
    )
  ) {
    errors.monthlyRent = "Monthly rent must be greater than 0";
  }

  for (const field of [
    "advanceAmount",
    "maintenanceAmount",
    "refundableAmount",
  ]) {
    if (
      data[field] !== undefined &&
      (
        Number.isNaN(Number(data[field])) ||
        Number(data[field]) < 0
      )
    ) {
      errors[field] = `${field} must be 0 or greater`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}