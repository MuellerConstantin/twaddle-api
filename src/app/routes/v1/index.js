import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import chatRoutes from './chats';
import messageRoutes from './messages';

// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/v1', authRoutes);
router.use('/v1', userRoutes);
router.use('/v1', chatRoutes);
router.use('/v1', messageRoutes);

export default router;
