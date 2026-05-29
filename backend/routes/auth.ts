import { Router } from 'express';
import { login, register, getMe, getAllUsers, updateUserRole, deleteUser, updateProfile, changePassword } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register (Public)
// Creates a new user account and returns an initial auth token
router.post('/register', register);

// POST /api/auth/login (Public)
// Authenticates an existing user and returns a fresh auth token
router.post('/login', login);

// GET /api/auth/me (Protected)
// Uses the 'protect' middleware to verify the token before fetching the user's profile
router.get('/me', protect, getMe);

// PATCH /api/auth/profile (Protected)
// Updates the authenticated user's own name and/or email
router.patch('/profile', protect, updateProfile);

// PUT /api/auth/password (Protected)
// Changes the authenticated user's password (requires current + new password)
router.put('/password', protect, changePassword);

// GET /api/auth/users (Protected: Admin only)
router.get('/users', protect, authorize('admin'), getAllUsers);

// PATCH /api/auth/users/:id/role (Protected: Admin only)
router.patch('/users/:id/role', protect, authorize('admin'), updateUserRole);

// DELETE /api/auth/users/:id (Protected: Admin only)
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;
