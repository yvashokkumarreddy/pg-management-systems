const MAX_PHOTO_SIZE =
  5 * 1024 * 1024;


const ALLOWED_PHOTO_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
];


const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/octet-stream",
];


export function validateCreatePgProfile(
  data
) {
  const errors = {};

  if (
    !data.pgName ||
    typeof data.pgName !== "string" ||
    !data.pgName.trim()
  ) {
    errors.pgName =
      "PG name is required";
  }

  if (
    data.pgName &&
    data.pgName.trim().length > 200
  ) {
    errors.pgName =
      "PG name must not exceed 200 characters";
  }

  if (
    data.description != null &&
    typeof data.description !== "string"
  ) {
    errors.description =
      "Description must be a string";
  }

  if (
    data.description &&
    data.description.length > 2000
  ) {
    errors.description =
      "Description must not exceed 2000 characters";
  }

  if (
    data.address != null &&
    typeof data.address !== "string"
  ) {
    errors.address =
      "Address must be a string";
  }

  if (
    data.address &&
    data.address.length > 500
  ) {
    errors.address =
      "Address must not exceed 500 characters";
  }

  if (
    data.contactNumber != null &&
    typeof data.contactNumber !== "string"
  ) {
    errors.contactNumber =
      "Contact number must be a string";
  }

  if (
    data.contactNumber &&
    data.contactNumber.length > 20
  ) {
    errors.contactNumber =
      "Contact number must not exceed 20 characters";
  }

  if (
    data.amenities != null &&
    !Array.isArray(
      data.amenities
    )
  ) {
    errors.amenities =
      "Amenities must be an array";
  }

  if (
    data.roomTypes != null &&
    !Array.isArray(
      data.roomTypes
    )
  ) {
    errors.roomTypes =
      "Room types must be an array";
  }

  if (
    data.isPublished != null &&
    typeof data.isPublished !==
      "boolean"
  ) {
    errors.isPublished =
      "isPublished must be boolean";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
}


export function validateUpdatePgProfile(
  data
) {
  const allowedFields = [
    "pgName",
    "description",
    "address",
    "contactNumber",
    "amenities",
    "roomTypes",
    "isPublished",
  ];

  const hasAllowedField =
    allowedFields.some(
      (field) =>
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
    );

  if (!hasAllowedField) {
    return {
      isValid: false,

      errors: {
        body:
          "At least one valid field is required",
      },
    };
  }

  /*
   * Reuse create validation.
   * pgName isn't mandatory for PATCH
   * unless supplied.
   */
  const errors = {};


  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "pgName"
    )
  ) {
    if (
      typeof data.pgName !== "string" ||
      !data.pgName.trim()
    ) {
      errors.pgName =
        "PG name cannot be empty";
    }

    if (
      data.pgName?.trim().length > 200
    ) {
      errors.pgName =
        "PG name must not exceed 200 characters";
    }
  }


  if (
    data.description != null &&
    typeof data.description !== "string"
  ) {
    errors.description =
      "Description must be a string";
  }


  if (
    data.description &&
    data.description.length > 2000
  ) {
    errors.description =
      "Description must not exceed 2000 characters";
  }


  if (
    data.address != null &&
    typeof data.address !== "string"
  ) {
    errors.address =
      "Address must be a string";
  }


  if (
    data.address &&
    data.address.length > 500
  ) {
    errors.address =
      "Address must not exceed 500 characters";
  }


  if (
    data.contactNumber != null &&
    typeof data.contactNumber !== "string"
  ) {
    errors.contactNumber =
      "Contact number must be a string";
  }


  if (
    data.contactNumber &&
    data.contactNumber.length > 20
  ) {
    errors.contactNumber =
      "Contact number must not exceed 20 characters";
  }


  if (
    data.amenities != null &&
    !Array.isArray(
      data.amenities
    )
  ) {
    errors.amenities =
      "Amenities must be an array";
  }


  if (
    data.roomTypes != null &&
    !Array.isArray(
      data.roomTypes
    )
  ) {
    errors.roomTypes =
      "Room types must be an array";
  }


  if (
    data.isPublished != null &&
    typeof data.isPublished !==
      "boolean"
  ) {
    errors.isPublished =
      "isPublished must be boolean";
  }


  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
}


export function validatePgPhoto(
  file
) {
  const errors = {};

  if (!file) {
    errors.file =
      "Photo is required";

    return {
      isValid: false,
      errors,
    };
  }


  const extension =
    file.name
      ?.split(".")
      .pop()
      ?.toLowerCase();


  if (
    !extension ||
    !ALLOWED_PHOTO_EXTENSIONS.includes(
      extension
    )
  ) {
    errors.file =
      "Only JPG, JPEG, PNG and WEBP photos are allowed";
  }


  if (
    file.type &&
    !ALLOWED_PHOTO_MIME_TYPES.includes(
      file.type
    )
  ) {
    errors.file =
      "Invalid photo type";
  }


  if (
    file.size <= 0
  ) {
    errors.file =
      "Photo file is empty";
  }


  if (
    file.size >
    MAX_PHOTO_SIZE
  ) {
    errors.file =
      "Photo must not exceed 5 MB";
  }


  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
}


export function validateSortOrder(
  value
) {
  const sortOrder =
    Number(value);

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    return {
      isValid: false,

      errors: {
        sortOrder:
          "Sort order must be a non-negative integer",
      },
    };
  }

  return {
    isValid: true,
    sortOrder,
    errors: {},
  };
}