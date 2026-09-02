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

/**
 * Validates actual binary magic bytes of the uploaded file to ensure
 * it is genuinely a PDF, JPEG, or PNG, preventing disguised file uploads.
 */
const validateTicketMagicBytes = (
  req: Express.Request,
  _res: Express.Response,
  next: (err?: unknown) => void
): void => {
  const file = req.file;
  if (!file) {
    return next(ApiError.badRequest("Ticket file is required."));
  }

  const filePath = file.path;
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const isPdf =
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46; // %PDF
    const isJpeg =
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff; // JPEG SOI
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a; // PNG signature

    if (!isPdf && !isJpeg && !isPng) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return next(
        ApiError.unsupportedMediaType(
          "Invalid file content signature. Uploaded file does not match genuine PDF or image format."
        )
      );
    }

    return next();
  } catch (error) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore
      }
    }
    return next(error);
  }
};

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
  validateTicketMagicBytes as never,
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
