import { Router } from 'express';
import { getAllFAQs, getFAQById, createFAQ, updateFAQ, deleteFAQ, checkFAQMatch, getPaginatedFAQs } from '../controllers/faqController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/faq — Fetch all FAQs (neatly grouped by category)
// Optional: ?page=1&limit=20&category=X returns flat paginated list instead
router.get('/', protect, getAllFAQs);

// GET /api/faq/paginated — Flat paginated list of FAQs (for large category views)
router.get('/paginated', protect, getPaginatedFAQs);

// POST /api/faq/check-match — Check if a question already exists in the FAQ (before posting on community)
router.post('/check-match', protect, checkFAQMatch);

// GET /api/faq/:id — Fetch a single FAQ by ID
router.get('/:id', protect, getFAQById);

// POST /api/faq — Create a new FAQ (Admin/Moderator only)
router.post('/', protect, authorize('admin', 'moderator'), createFAQ);

// PUT /api/faq/:id — Update an existing FAQ (Admin/Moderator only)
router.put('/:id', protect, authorize('admin', 'moderator'), updateFAQ);

// DELETE /api/faq/:id — Delete an FAQ (Admin/Moderator only)
router.delete('/:id', protect, authorize('admin', 'moderator'), deleteFAQ);

export default router;