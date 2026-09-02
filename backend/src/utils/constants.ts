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
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
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
  // Travel Request
  TRAVEL_REQUEST_CREATED: "Travel request submitted successfully.",
  TRAVEL_REQUEST_FETCHED: "Travel request retrieved successfully.",
  TRAVEL_REQUESTS_FETCHED: "Travel requests retrieved successfully.",
  TRAVEL_REQUEST_CANCELLED: "Travel request cancelled successfully.",
  TRAVEL_REQUEST_NOT_FOUND: "Travel request not found.",
  TRAVEL_REQUEST_APPROVED: "Travel request approved successfully.",
  TRAVEL_REQUEST_REJECTED: "Travel request rejected successfully.",
  TRAVEL_REQUEST_INVALID_STATUS_TRANSITION:
    "This action cannot be performed on a request with the current status.",
  TRAVEL_REQUEST_NO_EMPLOYEE:
    "No employee profile is linked to your account. Please contact your administrator.",
  // Booking
  BOOKING_CREATED: "Flight booking created successfully.",
  BOOKING_FETCHED: "Booking details retrieved successfully.",
  BOOKING_NOT_FOUND: "Booking not found.",
  BOOKING_ALREADY_EXISTS: "A booking already exists for this travel request.",
  BOOKING_ONLY_FOR_APPROVED: "Bookings can only be created for APPROVED travel requests.",
  TICKET_UPLOADED: "Ticket file uploaded successfully.",
  TICKET_ALREADY_EXISTS: "A ticket has already been uploaded for this booking.",
  TICKET_NOT_FOUND: "Ticket file not found.",
  INVALID_FILE_TYPE: "Invalid file type. Only PDF, JPEG, and PNG files are allowed.",
  FILE_TOO_LARGE: "File size exceeds the 5 MB limit.",
  // Reports & Analytics
  REPORTS_SUMMARY_FETCHED: "Dashboard summary statistics retrieved successfully.",
  REPORTS_MONTHLY_FETCHED: "Monthly travel analytics retrieved successfully.",
  REPORTS_DEPARTMENTS_FETCHED: "Department travel analytics retrieved successfully.",
  REPORTS_VENDORS_FETCHED: "Vendor booking analytics retrieved successfully.",
  REPORTS_TRAVEL_REQUESTS_FETCHED: "Travel request report retrieved successfully.",
  REPORTS_BOOKINGS_FETCHED: "Booking report retrieved successfully.",
  // Audit Logs
  AUDIT_LOGS_FETCHED: "Audit logs retrieved successfully.",
  AUDIT_LOG_FETCHED: "Audit log detail retrieved successfully.",
  AUDIT_LOG_NOT_FOUND: "Audit log not found.",
} as const;

export const AUDIT_ACTIONS = {
  USER_LOGIN: "USER_LOGIN",
  TRAVEL_REQUEST_CREATED: "TRAVEL_REQUEST_CREATED",
  TRAVEL_REQUEST_APPROVED: "TRAVEL_REQUEST_APPROVED",
  TRAVEL_REQUEST_REJECTED: "TRAVEL_REQUEST_REJECTED",
  TRAVEL_REQUEST_CANCELLED: "TRAVEL_REQUEST_CANCELLED",
  BOOKING_CREATED: "BOOKING_CREATED",
  TICKET_UPLOADED: "TICKET_UPLOADED",
  REPORT_EXPORTED: "REPORT_EXPORTED",
  ROLE_CHANGED: "ROLE_CHANGED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_LOGOUT: "USER_LOGOUT",
  TOKEN_REFRESHED: "TOKEN_REFRESHED",
} as const;

export type AuditActionType = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUTH_COOKIE_NAME = "etms_auth_token";
export const REFRESH_COOKIE_NAME = "etms_refresh_token";
