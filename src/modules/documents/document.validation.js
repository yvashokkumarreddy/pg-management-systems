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
  "application/octet-stream",
];


const MAX_FILE_SIZE =
  5 * 1024 * 1024;


export function validateDocumentUpload({
  documentType,
  documentSide,
  file,
}) {
  const errors = {};


  if (
    !documentType ||
    !VALID_DOCUMENT_TYPES.includes(
      documentType
    )
  ) {
    errors.documentType =
      "Invalid document type";
  }


  if (
    documentType ===
    "AADHAAR"
  ) {
    if (
      !documentSide ||
      !VALID_DOCUMENT_SIDES.includes(
        documentSide
      )
    ) {
      errors.documentSide =
        "Aadhaar side must be FRONT or BACK";
    }
  }


  /*
   * PHOTO and OTHER
   * must not have a side.
   */
  if (
    documentType &&
    documentType !==
      "AADHAAR" &&
    documentSide
  ) {
    errors.documentSide =
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
    typeof file.name !==
    "string"
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