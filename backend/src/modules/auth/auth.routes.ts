import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { authLimiter } from "../../middleware/rateLimit.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user via email or employee ID and return JWT + Refresh token
 * @access  Public (Rate-limited)
 */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotate refresh token and obtain a new short-lived access token
 * @access  Public (Cookie/Body validated)
 */
router.post(
  "/refresh",
  authController.refresh.bind(authController)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke refresh token and clear authentication cookies
 * @access  Public (Idempotent session termination)
 */
router.post(
  "/logout",
  authController.logout.bind(authController)
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and employee (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get currently logged in user profile with employee details
 * @access  Private (Authenticated)
 */
router.get(
  "/profile",
  authenticate,
  authController.getProfile.bind(authController)
);

export default router;

