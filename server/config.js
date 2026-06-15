const path = require('path');
const crypto = require('crypto');

try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) {}

const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('[security] JWT_SECRET is not set. A temporary secret is being used; set JWT_SECRET before production deployment.');
}

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  smsAccessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
  smsAccessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
  smsSignName: process.env.SMS_SIGN_NAME || 'QEVORA',
  smsTemplateCode: process.env.SMS_TEMPLATE_CODE || '',
  smsMock: process.env.SMS_MOCK === 'true',
  allowDevCodes: process.env.ALLOW_DEV_CODES === 'true',
  dataDir: path.join(__dirname, 'data'),
  projectRoot: path.join(__dirname, '..'),
  usdt: {
    address: process.env.USDT_ADDRESS || 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    network: process.env.USDT_NETWORK || 'TRC20',
    rate: parseFloat(process.env.USDT_RATE) || 7.2
  }
};
