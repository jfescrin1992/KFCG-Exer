import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_assessment_secret_token_123!';

export interface LocalDecodedToken {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'superadmin';
}

export interface AuthRequest extends Request {
  user?: LocalDecodedToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as LocalDecodedToken;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying session token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }
};

