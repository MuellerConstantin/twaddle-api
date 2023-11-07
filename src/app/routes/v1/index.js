import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import privateChatRoutes from './privateChats';
import groupChatRoutes from './groupChats';

// eslint-disable-next-line new-cap
const router = express.Router();

router.use('/v1', authRoutes);
router.use('/v1', userRoutes);
router.use('/v1', privateChatRoutes);
router.use('/v1', groupChatRoutes);

export default router;
