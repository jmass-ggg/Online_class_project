export function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function validateEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

export function validatePasswords(password, confirmPassword) {
  if (!required(password)) return "Password is required";
  if (!required(confirmPassword)) return "Confirm password is required";
  if (password !== confirmPassword) return "Passwords must match";
  return "";
}

export function parseApiError(error, fallback = "Something went wrong. Please try again") {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (!error?.response) return "Network error. Please check your connection";
  if (status === 401) return "Invalid email or password";
  if (status === 403) return "You do not have permission to perform this action";
  if (status === 404) return "The requested resource was not found";
  if (status >= 500) return "Server error. Please try again later";

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const firstValue = data[firstKey];
    if (Array.isArray(firstValue)) return `${firstKey}: ${firstValue[0]}`;
    if (typeof firstValue === "string") return `${firstKey}: ${firstValue}`;
  }

  return fallback;
}

export function validateDateRange(startDate, endDate) {
  if (!required(startDate)) return "Start date is required";
  if (!required(endDate)) return "End date is required";
  if (new Date(endDate) <= new Date(startDate)) return "End date should be after start date";
  return "";
}

export function validateTimeRange(startTime, endTime) {
  if (!required(startTime)) return "Start time is required";
  if (!required(endTime)) return "End time is required";
  if (startTime >= endTime) return "End time must be after start time";
  return "";
}
