const VALID_CAPACITIES = [2, 3, 4, 5,6];

export function validateCreateRoom(data) {
  const errors = {};

  if (!data.ownerId || typeof data.ownerId !== "string") {
    errors.ownerId = "Owner ID is required";
  }

  if (
    !data.roomNumber ||
    typeof data.roomNumber !== "string" ||
    !data.roomNumber.trim()
  ) {
    errors.roomNumber = "Room number is required";
  }

  if (
    data.capacity === undefined ||
    !VALID_CAPACITIES.includes(Number(data.capacity))
  ) {
    errors.capacity =
      "Capacity must be one of 2, 3, 4, or 5";
  }

  if (
    data.rentPerBed === undefined ||
    data.rentPerBed === null ||
    Number.isNaN(Number(data.rentPerBed)) ||
    Number(data.rentPerBed) <= 0
  ) {
    errors.rentPerBed =
      "Rent per bed must be greater than 0";
  }

  if (
    data.floor !== undefined &&
    data.floor !== null &&
    typeof data.floor !== "string"
  ) {
    errors.floor = "Floor must be valid";
  }

  if (
    data.notes !== undefined &&
    data.notes !== null &&
    typeof data.notes !== "string"
  ) {
    errors.notes = "Notes must be valid";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateUpdateRoom(data) {
  const errors = {};

  if (
    data.roomNumber !== undefined &&
    (
      typeof data.roomNumber !== "string" ||
      !data.roomNumber.trim()
    )
  ) {
    errors.roomNumber =
      "Room number must be valid";
  }

  if (
    data.capacity !== undefined &&
    !VALID_CAPACITIES.includes(Number(data.capacity))
  ) {
    errors.capacity =
      "Capacity must be one of 2, 3, 4, or 5";
  }

  if (
    data.rentPerBed !== undefined &&
    (
      Number.isNaN(Number(data.rentPerBed)) ||
      Number(data.rentPerBed) <= 0
    )
  ) {
    errors.rentPerBed =
      "Rent per bed must be greater than 0";
  }

  if (
    data.floor !== undefined &&
    data.floor !== null &&
    typeof data.floor !== "string"
  ) {
    errors.floor = "Floor must be valid";
  }

  if (
    data.notes !== undefined &&
    data.notes !== null &&
    typeof data.notes !== "string"
  ) {
    errors.notes = "Notes must be valid";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}