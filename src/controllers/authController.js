const authMiddleware = require('../middleware/auth');

// Mock user database (in production, use real database)
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123', // In production, use bcrypt hashing
    role: 'admin',
    name: 'System Administrator'
  },
  {
    id: 2,
    username: 'operator',
    password: 'operator123',
    role: 'operator', 
    name: 'Alert Operator'
  },
  {
    id: 3,
    username: 'viewer',
    password: 'viewer123',
    role: 'viewer',
    name: 'Dashboard Viewer'
  }
];

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required.'
        });
      }

      // Find user (in production, use proper authentication)
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials.'
        });
      }

      // Generate token
      const token = authMiddleware.generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication.'
      });
    }
  }

  async getProfile(req, res) {
    res.json({
      success: true,
      user: req.user
    });
  }
}

module.exports = new AuthController();