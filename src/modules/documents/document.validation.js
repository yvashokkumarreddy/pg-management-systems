export const VALID_DOCUMENT_TYPES = [
  "AADHAAR",
  "PHOTO",
  "OTHER",
];


export const VALID_DOCUMENT_SIDES = [
  "FRONT",
  "BACK",
];


const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
];


const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",

  /*
   * Postman/Windows can send
   * JPG files using this generic
   * MIME type.
   */
  "application/octet-stream",
];


const MAX_FILE_SIZE =
  5 * 1024 * 1024;


export function validateDocumentUpload({
  type,
  side,
  file,
}) {
  const errors = {};


  if (
    !type ||
    !VALID_DOCUMENT_TYPES.includes(type)
  ) {
    errors.type =
      "Invalid document type";
  }


  /*
   * Aadhaar requires FRONT/BACK.
   */
  if (type === "AADHAAR") {
    if (
      !side ||
      !VALID_DOCUMENT_SIDES.includes(side)
    ) {
      errors.side =
        "Aadhaar side must be FRONT or BACK";
    }
  }


  /*
   * PHOTO/OTHER cannot have side.
   */
  if (
    type &&
    type !== "AADHAAR" &&
    side
  ) {
    errors.side =
      "Document side is only allowed for Aadhaar";
  }


  if (!file) {
    errors.file =
      "Document file is required";

    return {
      isValid: false,
      errors,
    };
  }


  if (
    typeof file.name !== "string"
  ) {
    errors.file =
      "Invalid document file";

    return {
      isValid: false,
      errors,
    };
  }


  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();


  if (
    !extension ||
    !ALLOWED_EXTENSIONS.includes(
      extension
    )
  ) {
    errors.file =
      "Only PDF, JPG, JPEG and PNG files are allowed";
  }


  if (
    file.type &&
    !ALLOWED_MIME_TYPES.includes(
      file.type
    )
  ) {
    errors.file =
      "Invalid file type";
  }


  if (
    file.size <= 0
  ) {
    errors.file =
      "Document file is empty";
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    errors.file =
      "File size must not exceed 5 MB";
  }


  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
}