const jwt = require('jsonwebtoken');
const config = require('../config');

function generateToken(member) {
  return jwt.sign(
    { id: member.id, phone: member.phone, role: member.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

module.exports = { generateToken };
