const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // ✅ Check authorization header
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực',
      code: 'NO_TOKEN'
    });
  }

  // ✅ Check Bearer format
  if (!req.headers.authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token phải có định dạng: Bearer <token>',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  try {
    // Extract token from header: "Bearer <token>"
    token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
        code: 'EMPTY_TOKEN'
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');

    // ✅ Validate required fields in token
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Token không chứa thông tin cần thiết',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    // Attach user info to request for downstream handlers
    req.user = decoded;
    next();
  } catch (error) {
    // ✅ Distinguish between different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('[Backend Error] Token verification failed:', error.message);
    res.status(401).json({
      success: false,
      message: 'Xác thực thất bại',
      code: 'AUTH_FAILED'
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // ✅ Check req.user exists (protect middleware should run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không có thông tin người dùng',
        code: 'NO_USER_INFO'
      });
    }

    // ✅ Check if user has one of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        code: 'INSUFFICIENT_PRIVILEGES',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
