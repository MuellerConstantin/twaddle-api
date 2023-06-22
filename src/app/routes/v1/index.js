import express from 'express';
import userRoutes from './users';

// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/v1', userRoutes);

export default router;
