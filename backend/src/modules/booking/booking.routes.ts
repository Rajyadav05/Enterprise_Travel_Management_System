import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { ApiError } from "../../utils/ApiError";
import { RESPONSE_MESSAGES } from "../../utils/constants";
import { bookingController } from "./booking.controller";
import { createBookingSchema } from "./booking.validation";

// ─── Multer Storage & Security Configuration ─────────────────────────────────

const uploadDir = path.resolve(process.cwd(), "uploads", "tickets");

// Ensure directory exists on startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const safeId = (rawId ?? "ticket").replace(/[^a-zA-Z0-9_-]/g, "");
    const randomHex = crypto.randomBytes(6).toString("hex");
    const timestamp = Date.now();

    // Secure extension detection from MIME type
    let ext = ".pdf";
    if (file.mimetype === "image/jpeg") ext = ".jpg";
    else if (file.mimetype === "image/png") ext = ".png";

    const safeFilename = `ticket_${safeId}_${timestamp}_${randomHex}${ext}`;
    cb(null, safeFilename);
  },
});

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.unsupportedMediaType(RESPONSE_MESSAGES.INVALID_FILE_TYPE));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

// ─── Admin Booking Router (/api/admin/bookings) ──────────────────────────────

export const adminBookingRouter = Router();

adminBookingRouter.use(authenticate, authorize("ADMIN"));

/**
 * @route   GET /api/admin/bookings/:id
 * @desc    Get full booking detail with all organization relations
 * @access  Private (Admin)
 */
adminBookingRouter.get(
  "/:id",
  bookingController.getAdminBookingById.bind(bookingController)
);

/**
 * @route   POST /api/admin/bookings/:id/ticket
 * @desc    Upload ticket file (PDF, JPEG, PNG <= 5MB)
 * @access  Private (Admin)
 */
adminBookingRouter.post(
  "/:id/ticket",
  upload.single("ticket"),
  bookingController.uploadTicket.bind(bookingController)
);

// ─── Travel Booking Router (/api/travel/bookings) ────────────────────────────

export const travelBookingRouter = Router();

travelBookingRouter.use(authenticate);

/**
 * @route   GET /api/travel/bookings/:id/ticket
 * @desc    Download / view ticket file (Owner or Admin)
 * @access  Private (Employee or Admin)
 */
travelBookingRouter.get(
  "/:id/ticket",
  bookingController.getTicketFile.bind(bookingController)
);

// ─── Request-Level Booking Routes Helpers ─────────────────────────────────────

export { createBookingSchema };
