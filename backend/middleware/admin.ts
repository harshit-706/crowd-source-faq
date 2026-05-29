import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const adminOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    if (!['admin', 'moderator'].includes(user.role)) {
      res.status(403).json({ message: 'Access denied. Admin role required.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};