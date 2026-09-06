export function validateLogin(
  data
) {
  const errors = {};


  if (
    !data.email ||
    typeof data.email !== "string"
  ) {
    errors.email =
      "Email is required";
  }


  if (
    !data.password ||
    typeof data.password !== "string"
  ) {
    errors.password =
      "Password is required";
  }


  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,
  };
}