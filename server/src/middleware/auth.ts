import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    department: string;
    role: string;
  };
}

export const generateToken = (user: { id: number; email: string; name: string; department: string; role: string }): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  const payload = { 
    id: user.id, 
    email: user.email, 
    name: user.name, 
    department: user.department,
    role: user.role 
  };
  
  const expiresIn = process.env['JWT_EXPIRES_IN'] || '7d';
  
  // Use type assertion to work around JWT library type issues
  return (jwt.sign as any)(payload, secret, { expiresIn });
};

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
  return bcrypt.hash(password, rounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      return res.status(500).json({ error: 'JWT configuration error' });
    }
    
    const decoded = jwt.verify(token, secret) as any;
    
    // Verify user still exists and is active
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        department: users.department,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      department: user[0].department,
      role: user[0].role,
    };

    return next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
};
