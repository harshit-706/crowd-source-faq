import { Router } from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  toggleUpvote,
  addComment,
  resolvePost,
  deletePost,
  toggleCommentUpvote,
  toggleCommentDownvote,
  verifyComment,
  getSolvedPosts,
} from '../controllers/communityController.js';
import { searchCommunityPosts } from '../controllers/communitySearchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/search', protect, searchCommunityPosts);
router.get('/solved', getSolvedPosts); // public endpoint for "Top Solved Today" widget

router.get('/', protect, getAllPosts);
router.get('/:id', protect, getPostById);
router.post('/', protect, createPost);
router.post('/:id/upvote', protect, toggleUpvote);
router.post('/:id/comments', protect, addComment);
router.post('/:id/comments/:commentId/upvote', protect, toggleCommentUpvote);
router.post('/:id/comments/:commentId/downvote', protect, toggleCommentDownvote);
router.patch('/:id/comments/:commentId/verify', protect, authorize('admin', 'moderator'), verifyComment);
router.patch('/:id/resolve', protect, resolvePost);
router.delete('/:id', protect, authorize('admin', 'moderator'), deletePost);

export default router;