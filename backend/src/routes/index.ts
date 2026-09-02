import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { adminAuditRouter } from "../modules/audit/audit.routes";
import {
  adminBookingRouter,
  travelBookingRouter,
} from "../modules/booking/booking.routes";
import { adminReportsRouter } from "../modules/reports/reports.routes";
import {
  adminTravelRouter,
  employeeTravelRouter,
} from "../modules/travel/travel.routes";

const router = Router();

// Mount module routes
router.use("/auth", authRoutes);
router.use("/travel/requests", employeeTravelRouter);
router.use("/admin/travel/requests", adminTravelRouter);
router.use("/admin/bookings", adminBookingRouter);
router.use("/travel/bookings", travelBookingRouter);
router.use("/admin/reports", adminReportsRouter);
router.use("/admin/audit-logs", adminAuditRouter);

export default router;
