import jwt from 'jsonwebtoken';
import { findUserById } from '../db.js';

const JWT_SECRET = process.env.APP_JWT_SECRET || 'MY_SECRET_KEY_2025';

function jwtExpiresIn() {
  const raw = process.env.APP_JWT_EXPIRATION;
  if (!raw) return '1h';
  const n = Number(raw);
  if (!Number.isNaN(n) && n > 100000) return Math.floor(n / 1000);
  if (!Number.isNaN(n)) return n;
  return raw;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, roles: user.roles },
    JWT_SECRET,
    { expiresIn: jwtExpiresIn() }
  );
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  jwt.verify(header.slice(7), JWT_SECRET, async (err, payload) => {
    if (!err && payload?.sub) {
      const user = await findUserById(payload.sub);
      if (user) req.user = user;
    }
    next();
  });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(header.slice(7), JWT_SECRET, async (err, payload) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const ok = roles.some((r) => req.user.roles.includes(r));
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
