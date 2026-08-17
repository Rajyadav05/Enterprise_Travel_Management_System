import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";

const router = Router();

// Mount module routes
router.use("/auth", authRoutes);

export default router;
