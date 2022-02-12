import express from "express";
import userRoutes from "./users";
import profileRoutes from "./profiles";

const router = express.Router();

router.use("/v1", userRoutes);
router.use("/v1", profileRoutes);

export default router;
