import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { bookingController } from "../booking/booking.controller";
import { createBookingSchema } from "../booking/booking.validation";
import { travelController } from "./travel.controller";
import {
  adminListQuerySchema,
  createTravelRequestSchema,
  rejectTravelRequestSchema,
} from "./travel.validation";

// ─── Employee Travel Router ──────────────────────────────────────────────────
// Mounted at: /api/travel/requests
export const employeeTravelRouter = Router();

employeeTravelRouter.use(authenticate);

/**
 * @route   POST /api/travel/requests
 * @desc    Create a new travel request for authenticated employee
 * @access  Private (Employee)
 */
employeeTravelRouter.post(
  "/",
  validate(createTravelRequestSchema),
  travelController.createRequest.bind(travelController)
);

/**
 * @route   GET /api/travel/requests
 * @desc    List all travel requests for authenticated employee
 * @access  Private (Employee)
 */
employeeTravelRouter.get(
  "/",
  travelController.listMyRequests.bind(travelController)
);

/**
 * @route   GET /api/travel/requests/:id
 * @desc    Get single travel request by ID (owner only)
 * @access  Private (Employee)
 */
employeeTravelRouter.get(
  "/:id",
  travelController.getRequestById.bind(travelController)
);

/**
 * @route   PATCH /api/travel/requests/:id/cancel
 * @desc    Cancel a PENDING travel request (owner only)
 * @access  Private (Employee)
 */
employeeTravelRouter.patch(
  "/:id/cancel",
  travelController.cancelRequest.bind(travelController)
);

/**
 * @route   GET /api/travel/requests/:id/booking
 * @desc    Get booking details for a travel request (Owner or Admin)
 * @access  Private (Employee or Admin)
 */
employeeTravelRouter.get(
  "/:id/booking",
  bookingController.getBookingForTravelRequest.bind(bookingController)
);

// ─── Admin Travel Router ─────────────────────────────────────────────────────
// Mounted at: /api/admin/travel/requests
export const adminTravelRouter = Router();

adminTravelRouter.use(authenticate, authorize("ADMIN"));

/**
 * @route   GET /api/admin/travel/requests
 * @desc    List all travel requests with filters & pagination
 * @access  Private (Admin)
 */
adminTravelRouter.get(
  "/",
  validate({ query: adminListQuerySchema }),
  travelController.adminListRequests.bind(travelController)
);

/**
 * @route   GET /api/admin/travel/requests/:id
 * @desc    Get single travel request full details
 * @access  Private (Admin)
 */
adminTravelRouter.get(
  "/:id",
  travelController.adminGetRequestById.bind(travelController)
);

/**
 * @route   PATCH /api/admin/travel/requests/:id/approve
 * @desc    Approve a PENDING travel request
 * @access  Private (Admin)
 */
adminTravelRouter.patch(
  "/:id/approve",
  travelController.approveRequest.bind(travelController)
);

/**
 * @route   PATCH /api/admin/travel/requests/:id/reject
 * @desc    Reject a PENDING travel request with reason
 * @access  Private (Admin)
 */
adminTravelRouter.patch(
  "/:id/reject",
  validate(rejectTravelRequestSchema),
  travelController.rejectRequest.bind(travelController)
);

/**
 * @route   POST /api/admin/travel/requests/:id/booking
 * @desc    Create a flight booking for an APPROVED travel request
 * @access  Private (Admin)
 */
adminTravelRouter.post(
  "/:id/booking",
  validate(createBookingSchema),
  bookingController.createBooking.bind(bookingController)
);

export default employeeTravelRouter;
