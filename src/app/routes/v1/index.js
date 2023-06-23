import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';

// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/v1', authRoutes);
router.use('/v1', userRoutes);

export default router;
