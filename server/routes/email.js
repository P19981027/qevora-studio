const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const config = require('../config');

// In-memory code store: { email: { code, expires } }
const emailCodes = {};

function cleanExpired() {
  const now = Date.now();
  for (const key of Object.keys(emailCodes)) {
    if (emailCodes[key].expires < now) delete emailCodes[key];
  }
}

router.post('/send', async (req, res) => {
  try {
    const { email, type = 'register' } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: '请输入正确的邮箱地址' });
    }

    cleanExpired();

    // Rate limit: 60s between sends
    if (emailCodes[email] && (emailCodes[email].expires - Date.now()) > 540000) {
      return res.status(400).json({ success: false, message: '验证码已发送，请1分钟后重试' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    emailCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 };

    const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpReady) {
      if (config.allowDevCodes) {
        console.log(`[email] SMTP not configured, dev code=${code} for ${email}`);
        return res.json({ success: true, message: '验证码已生成（开发模式）', code });
      }
      delete emailCodes[email];
      return res.status(500).json({ success: false, message: '邮箱服务未配置，请联系管理员' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: type === 'register' ? 'Qevora Studio - 邮箱验证码' : 'Qevora Studio - 验证码',
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a1a;color:#fff">
          <h1 style="color:#d4af37;font-size:24px;letter-spacing:4px">Qevora Studio</h1>
          <p style="font-size:16px;margin:24px 0">您的验证码：</p>
          <div style="font-size:36px;letter-spacing:8px;color:#d4af37;font-weight:700;padding:16px 0">${code}</div>
          <p style="color:#888;font-size:12px;margin-top:24px">有效期10分钟，请勿泄露。</p>
        </div>`
      });
      console.log(`[email] Sent code to ${email}`);
      return res.json({ success: true, message: '验证码已发送' });
    } catch (mailErr) {
      delete emailCodes[email];
      console.error('[email] SMTP failed:', mailErr.message);
      return res.status(500).json({ success: false, message: '邮件发送失败，请稍后重试' });
    }
  } catch (err) {
    console.error('[email] error:', err.message);
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

// Verify a code (called internally by auth route)
router.verifyCode = function (email, code) {
  cleanExpired();
  const record = emailCodes[email];
  if (!record) return { error: '请先获取验证码' };
  if (record.expires < Date.now()) {
    delete emailCodes[email];
    return { error: '验证码已过期' };
  }
  if (record.code !== code) return { error: '验证码错误' };
  delete emailCodes[email];
  return { success: true };
};

module.exports = router;