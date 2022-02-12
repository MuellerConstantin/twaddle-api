import express from "express";
import userRoutes from "./users";
import profileRoutes from "./profiles";
import tokenRoutes from "./tokens";

const router = express.Router();

router.use("/v1", userRoutes);
router.use("/v1", profileRoutes);
router.use("/v1", tokenRoutes);

export default router;
