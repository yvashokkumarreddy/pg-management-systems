const VALID_CAPACITIES = [2, 3, 4, 5,6];

export function validateCreateRoom(data) {
  const errors = {};
console.log("Validating room data:", data);
  if (
    !data.roomNumber ||
    !String(data.roomNumber).trim()
  ) {
    errors.roomNumber =
      "Room number is required";
  }

  if (
    ![2, 3, 4, 5, 6].includes(
      Number(data.capacity)
    )
  ) {
    errors.capacity =
      "Capacity must be 2, 3, 4, 5, or 6  ";
  }

  if (
    data.rentPerBed === undefined ||
    data.rentPerBed === null ||
    data.rentPerBed === "" ||
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
    errors.floor =
      "Floor must be a string";
  }

  if (
    data.notes !== undefined &&
    data.notes !== null &&
    typeof data.notes !== "string"
  ) {
    errors.notes =
      "Notes must be a string";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}
export function validateUpdateRoom(data) {
  const errors = {};

  if (
    data.roomNumber !== undefined &&
    !String(data.roomNumber).trim()
  ) {
    errors.roomNumber =
      "Room number cannot be empty";
  }

  if (
    data.capacity !== undefined &&
    ![2, 3, 4, 5].includes(
      Number(data.capacity)
    )
  ) {
    errors.capacity =
      "Capacity must be 2, 3, 4, or 5";
  }

  if (
    data.rentPerBed !== undefined &&
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
    errors.floor =
      "Floor must be a string";
  }

  if (
    data.notes !== undefined &&
    data.notes !== null &&
    typeof data.notes !== "string"
  ) {
    errors.notes =
      "Notes must be a string";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,
    errors,
  };
}