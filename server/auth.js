const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'development-secret-change-this';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }

  next();
}

module.exports = {
  SECRET,
  authenticateToken,
  requireAdmin
};
