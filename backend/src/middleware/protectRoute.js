const jwt = require('jsonwebtoken');

function protectRoute(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authorization header with Bearer token is required',
      },
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      error: {
        code: 'AUTH_MISCONFIGURED',
        message: 'JWT secret is not configured',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId || decoded.id || decoded.sub;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Token payload must include a user id',
        },
      });
    }

    req.user = {
      id: String(userId),
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token is invalid or expired',
      },
    });
  }
}

module.exports = {
  protectRoute,
};
