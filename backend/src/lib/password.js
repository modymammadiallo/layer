export function validatePassword(password) {
  if (typeof password !== "string") {
    return "Password required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > 72) {
    return "Password must be at most 72 characters";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character";
  }
  return null;
}
