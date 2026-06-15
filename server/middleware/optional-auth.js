const jwt = require('jsonwebtoken');
const config = require('../config');

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    const token = authHeader.split(' ')[1];
    req.member = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    // Ignore invalid token for optional auth routes; protected routes still use auth.js.
  }
  next();
}
module.exports = optionalAuth;
