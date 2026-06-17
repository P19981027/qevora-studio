const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const memberModel = require('../models/member');
const orderModel = require('../models/order');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// List members
router.get('/members', authMiddleware, adminMiddleware, (req, res) => {
  const result = memberModel.list({
    page: parseInt(req.query.page) || 1,
    pageSize: parseInt(req.query.pageSize) || 20,
    search: req.query.search || ''
  });
  res.json({ success: true, ...result });
});

// Member detail with orders
router.get('/members/:id', authMiddleware, adminMiddleware, (req, res) => {
  const allOrders = orderModel._read().orders;
  const result = memberModel.getMemberWithOrders(req.params.id, allOrders);
  if (!result) return res.status(404).json({ success: false, message: '会员不存在' });
  res.json({ success: true, ...result });
});

// List all orders
router.get('/orders', authMiddleware, adminMiddleware, (req, res) => {
  const result = orderModel.list({
    page: parseInt(req.query.page) || 1,
    pageSize: parseInt(req.query.pageSize) || 20,
    status: req.query.status || '',
    memberId: req.query.memberId || '',
    orderNo: req.query.orderNo || ''
  });
  res.json({ success: true, ...result });
});

// Order detail
router.get('/orders/:id', authMiddleware, adminMiddleware, (req, res) => {
  const order = orderModel.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
  res.json({ success: true, order });
});

// Update order status
router.put('/orders/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'payment_submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: '无效的状态' });
  }
  const result = orderModel.updateStatus(req.params.id, status);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, order: result.order });
});

// Add tracking
router.put('/orders/:id/tracking', authMiddleware, adminMiddleware, (req, res) => {
  const { trackingNo, trackingCompany } = req.body;
  if (!trackingNo) {
    return res.status(400).json({ success: false, message: '请输入快递单号' });
  }
  const result = orderModel.updateTracking(req.params.id, trackingNo, trackingCompany || '');
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, order: result.order });
});

// Sync products from admin
router.put('/products/sync', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const filePath = path.join(config.projectRoot, 'data', 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true, message: '商品数据已同步' });
  } catch (err) {
    res.status(500).json({ success: false, message: '同步失败' });
  }
});

// Export products.json to Windows Desktop (for Cloudflare Pages deployment)
router.put('/products/export-desktop', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const os = require('os');
    const desktopPath = path.join(os.homedir(), 'Desktop', 'products.json');
    fs.writeFileSync(desktopPath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true, message: 'products.json 已保存到桌面', path: desktopPath });
  } catch (err) {
    res.status(500).json({ success: false, message: '保存到桌面失败: ' + err.message });
  }
});

module.exports = router;
