const mongoose = require('mongoose');

function requireMongo(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    error: {
      code: 'MONGO_UNAVAILABLE',
      message: 'MongoDB no esta disponible. Inicia Mongo y reintenta.',
    },
  });
}

module.exports = {
  requireMongo,
};
