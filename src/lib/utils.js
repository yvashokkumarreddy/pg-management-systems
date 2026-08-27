export function isValidId(value) {
  return typeof value === "string" && value.trim().length > 0;
}
