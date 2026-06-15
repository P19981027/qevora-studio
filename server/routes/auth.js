const express = require('express');
const router = express.Router();
const memberModel = require('../models/member');
const emailRoute = require('./email');
const { generateToken } = require('../services/jwt');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, code, nickname } = req.body;
    if (!email || !password || !code) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }
    const codeResult = emailRoute.verifyCode(email, code);
    if (codeResult.error) {
      return res.status(400).json({ success: false, message: codeResult.error });
    }
    const result = await memberModel.create({ email, password, nickname });
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    const token = generateToken(result.member);
    res.json({ success: true, token, member: result.member });
  } catch (err) {
    console.error('[auth] register error:', err.message);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// Login with password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请输入邮箱和密码' });
    }
    const result = await memberModel.verifyPassword(email, password);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    memberModel.updateLastLogin(result.member.id);
    const { passwordHash, ...safe } = result.member;
    const token = generateToken(safe);
    res.json({ success: true, token, member: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const member = memberModel.findById(req.member.id);
  if (!member) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  const { passwordHash, ...safe } = member;
  res.json({ success: true, member: safe });
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.nickname !== undefined) updates.nickname = req.body.nickname;
    if (req.body.defaultAddress !== undefined) updates.defaultAddress = req.body.defaultAddress;
    if (req.body.addresses !== undefined) updates.addresses = req.body.addresses;
    if (req.body.password) {
      if (!req.body.oldPassword) {
        return res.status(400).json({ success: false, message: '请输入原密码' });
      }
      const member = memberModel.findById(req.member.id);
      const valid = await bcrypt.compare(req.body.oldPassword, member.passwordHash);
      if (!valid) {
        return res.status(400).json({ success: false, message: '原密码错误' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(req.body.password, salt);
      updates.password = true;
    }
    const result = memberModel.updateProfile(req.member.id, updates);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, member: result.member });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

module.exports = router;