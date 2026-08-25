const jwt = require('jsonwebtoken');

const SECRET =
  process.env.JWT_SECRET ||
  'development-secret-change-this-in-production';

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    SECRET,
    {
      expiresIn: '7d'
    }
  );
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token'
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
  createToken,
  authenticateToken,
  requireAdmin
};
