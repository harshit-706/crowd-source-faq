import { Router } from 'express';
import { semanticSearch, getTrending } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// POST /api/search — Execute a hybrid (AI vector + keyword) search across FAQs and Community Posts
// Protected: Requires a valid JWT token
router.post('/', protect, semanticSearch);

// GET /api/search/trending — Fetch the top 6 most popular search queries from the analytics logs
// Protected: Requires a valid JWT token
router.get('/trending', protect, getTrending);

export default router;