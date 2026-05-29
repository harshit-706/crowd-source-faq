import { Router } from 'express';
import { getSearchAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics — Fetch aggregate search logs statistics (Admin/Moderator only)
router.get('/', protect, authorize('admin', 'moderator'), getSearchAnalytics);

export default router;