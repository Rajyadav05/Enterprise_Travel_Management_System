export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const RESPONSE_MESSAGES = {
  HEALTH_CHECK: "ETMS API is running",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTER_SUCCESS: "User and employee registered successfully",
  PROFILE_FETCH_SUCCESS: "Profile retrieved successfully",
  UNAUTHORIZED: "Authentication required. Please provide a valid access token.",
  FORBIDDEN: "Access denied. You do not have permission to perform this action.",
  NOT_FOUND: "Resource not found",
  INTERNAL_ERROR: "An unexpected internal server error occurred",
  INVALID_CREDENTIALS: "Invalid email/employee ID or password",
  USER_INACTIVE: "Your account is deactivated. Please contact your administrator.",
  EMPLOYEE_INACTIVE: "Employee record is inactive or resigned.",
  TOKEN_EXPIRED: "Authentication token has expired. Please log in again.",
  TOKEN_INVALID: "Invalid authentication token.",
} as const;

export const AUTH_COOKIE_NAME = "etms_auth_token";
