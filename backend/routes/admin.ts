import { Router } from 'express';
import { adminOnly } from '../middleware/admin';
import {
  getStats,
  getFaqGrowth,
  getTopCategories,
  getSearchInsights,
  getUsers,
  getAdminFAQs,
  approveFAQ,
  rejectFAQ,
  updateFAQ,
  deleteFAQ,
  createFAQ,
  getReports,
  getActivityFeed,
  getUserActivityChart,
} from '../controllers/adminController';

const router = Router();

router.use(adminOnly);

router.get('/stats', getStats);
router.get('/faq-growth', getFaqGrowth);
router.get('/top-categories', getTopCategories);
router.get('/search-insights', getSearchInsights);
router.get('/users', getUsers);
router.get('/faqs', getAdminFAQs);
router.get('/reports', getReports);
router.get('/activity-feed', getActivityFeed);
router.get('/user-activity-chart', getUserActivityChart);

router.post('/faq', createFAQ);
router.post('/faq/approve', approveFAQ);
router.post('/faq/reject', rejectFAQ);
router.put('/faq/:id', updateFAQ);
router.delete('/faq/:id', deleteFAQ);

export default router;