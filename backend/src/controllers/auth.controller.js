const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findUserByEmail, findUserById } = require('../db');

function buildAuthToken(user) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      userId: String(user.id || user._id),
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: '7d' },
  );
}

async function login(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email and password are required',
      },
    });
  }

  try {
    const user = findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email or password',
        },
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email or password',
        },
      });
    }

    const token = buildAuthToken(user);

    return res.json({
      token,
      tokenType: 'Bearer',
      user: {
        id: String(user.id || user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'No se pudo iniciar sesión',
      },
    });
  }
}

async function me(req, res) {
  try {
    const user = findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.json({
      user: {
        id: String(user.id || user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'ME_FAILED',
        message: 'No se pudo obtener la sesión',
      },
    });
  }
}

module.exports = {
  login,
  me,
};