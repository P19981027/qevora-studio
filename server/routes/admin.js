const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const memberModel = require('../models/member');
const orderModel = require('../models/order');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config');

const uploadStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('only images allowed'));
  }
});

router.get('/members', authMiddleware, adminMiddleware, (req, res) => {
  const result = memberModel.list({
    page: parseInt(req.query.page) || 1,
    pageSize: parseInt(req.query.pageSize) || 20,
    search: req.query.search || ''
  });
  res.json({ success: true, ...result });
});

router.get('/members/:id', authMiddleware, adminMiddleware, (req, res) => {
  const allOrders = orderModel._read().orders;
  const result = memberModel.getMemberWithOrders(req.params.id, allOrders);
  if (!result) return res.status(404).json({ success: false, message: 'not found' });
  res.json({ success: true, ...result });
});

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

router.get('/orders/:id', authMiddleware, adminMiddleware, (req, res) => {
  const order = orderModel.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'not found' });
  res.json({ success: true, order });
});

router.put('/orders/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'payment_submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'invalid status' });
  }
  const result = orderModel.updateStatus(req.params.id, status);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, order: result.order });
});

router.put('/orders/:id/tracking', authMiddleware, adminMiddleware, (req, res) => {
  const { trackingNo, trackingCompany } = req.body;
  if (!trackingNo) {
    return res.status(400).json({ success: false, message: 'enter tracking' });
  }
  const result = orderModel.updateTracking(req.params.id, trackingNo, trackingCompany || '');
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, order: result.order });
});

router.put('/products/sync', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const filePath = path.join(config.projectRoot, 'data', 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true, message: 'synced' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'sync failed' });
  }
});

router.put('/products/export-desktop', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const os = require('os');
    const desktopPath = path.join(os.homedir(), 'Desktop', 'products.json');
    fs.writeFileSync(desktopPath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true, message: 'saved to desktop', path: desktopPath });
  } catch (err) {
    res.status(500).json({ success: false, message: 'save failed: ' + err.message });
  }
});

router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ success: true, url: '/uploads/' + req.file.filename });
});

module.exports = router;
