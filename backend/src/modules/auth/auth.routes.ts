import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user via email or employee ID and return JWT
 * @access  Public
 */
router.post(
  "/login",
  validate(loginSchema),
  authController.login.bind(authController)
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and employee (Dev/Onboarding)
 * @access  Public
 */
router.post(
  "/register",
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
