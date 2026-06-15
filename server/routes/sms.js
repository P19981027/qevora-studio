const express = require('express');
const router = express.Router();
const smsService = require('../services/sms');

router.post('/send', async (req, res) => {
  try {
    const { phone, type = 'register' } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: '请输入手机号' });
    }
    const result = await smsService.sendSms(phone, type);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: result.message, ...(result.code ? { code: result.code } : {}) });
  } catch (err) {
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

module.exports = router;
