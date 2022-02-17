import express from "express";
import userRoutes from "./users";
import profileRoutes from "./profiles";
import roomRoutes from "./rooms";
import tokenRoutes from "./tokens";
import ticketRoutes from "./tickets";

const router = express.Router();

router.use("/v1", userRoutes);
router.use("/v1", profileRoutes);
router.use("/v1", roomRoutes);
router.use("/v1", tokenRoutes);
router.use("/v1", ticketRoutes);

export default router;
