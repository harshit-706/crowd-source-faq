import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser, UserRole } from '../models/User.js';

// Extend Express Request to include the user field
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Express middleware to protect routes requiring authentication
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // 1. Extract the token from the Authorization header (expected format: 'Bearer <token>')
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Reject the request immediately if no token is found
  if (!token) {
    res.status(401).json({ message: 'Not authorized. No token provided.' });
    return;
  }

  try {
    // 3. Verify the token using your secret key (this throws an error if it's invalid or expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // 4. Fetch the user from the database using the decoded ID, explicitly excluding the password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'User not found.' });
      return;
    }

    // 5. Successfully authenticated: attach the user object to the request and move to the next function
    req.user = user;
    next();
  } catch {
    // 7. Catch block handles any token verification failures
    res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

// Express middleware to restrict access to specific roles (RBAC)
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized. No user context.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `Forbidden. Role '${req.user.role}' is not authorized.` });
      return;
    }
    next();
  };
};