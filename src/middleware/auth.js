const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'alert-system-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthMiddleware {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token middleware
  verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token.'
      });
    }
  }

  // Admin role check middleware
  requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }
    next();
  }

  // Operator role check middleware
  requireOperator(req, res, next) {
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Operator role required.'
      });
    }
    next();
  }
}

module.exports = new AuthMiddleware();