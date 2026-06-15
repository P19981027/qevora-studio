const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optional-auth');
const orderModel = require('../models/order');
const cartModel = require('../models/cart');
const memberModel = require('../models/member');
const { normalizeOrderItems } = require('../services/products');

function cleanText(v, max = 120) { return String(v || '').trim().slice(0, max); }
function validateAddress(address) {
  if (!address) return '请填写收货地址';
  if (!cleanText(address.name, 50) || cleanText(address.name, 50).length < 2) return '收件人姓名至少2个字';
  if (!cleanText(address.phone, 30) || cleanText(address.phone, 30).length < 6) return '请填写联系电话';
  if (!cleanText(address.country, 60) || !cleanText(address.countryCode, 10)) return '请选择国家/地区';
  if (!cleanText(address.line1, 160) || cleanText(address.line1, 160).length < 5) return '详细地址至少5个字';
  if (!cleanText(address.city, 80)) return '请输入城市';
  if (!cleanText(address.zip, 30)) return '请输入邮政编码';
  return null;
}
function sanitizeAddress(a) {
  return {
    name: cleanText(a.name, 50), phone: cleanText(a.phone, 30), country: cleanText(a.country, 60), countryCode: cleanText(a.countryCode, 10),
    line1: cleanText(a.line1, 160), line2: cleanText(a.line2, 160), city: cleanText(a.city, 80), state: cleanText(a.state, 80), zip: cleanText(a.zip, 30)
  };
}

// Create order. Logged-in members can later view order history; guests receive an access token stored in browser localStorage.
router.post('/', optionalAuth, (req, res) => {
  try {
    const { address, items, remark } = req.body;
    const addrError = validateAddress(address);
    if (addrError) return res.status(400).json({ success: false, message: addrError });
    const normalized = normalizeOrderItems(items);
    if (normalized.error) return res.status(400).json({ success: false, message: normalized.error });
    let member = null;
    if (req.member && req.member.id) member = memberModel.findById(req.member.id);
    const order = orderModel.create({
      memberId: member ? member.id : null,
      memberEmail: member ? member.email : '',
      items: normalized.items,
      totalAmount: normalized.totalAmount,
      totalAmountText: normalized.totalAmountText,
      address: sanitizeAddress(address),
      remark: cleanText(remark, 500)
    });
    if (member) cartModel.removeItems(member.id, normalized.items);
    const safe = orderModel.publicOrder(order);
    res.json({ success: true, order: safe, accessToken: order.guestAccessToken || '' });
  } catch (err) {
    console.error('[orders] create error:', err.message);
    res.status(500).json({ success: false, message: '下单失败' });
  }
});

router.get('/', authMiddleware, (req, res) => {
  const result = orderModel.listByMember(req.member.id, {
    page: parseInt(req.query.page) || 1,
    pageSize: parseInt(req.query.pageSize) || 10,
    status: req.query.status || ''
  });
  res.json({ success: true, ...result });
});

router.get('/:id', optionalAuth, (req, res) => {
  const order = orderModel.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
  const accessToken = req.headers['x-order-token'] || req.query.accessToken;
  if (!orderModel.canAccess(order, req.member, accessToken)) return res.status(403).json({ success: false, message: '无权查看' });
  res.json({ success: true, order: orderModel.publicOrder(order) });
});

router.put('/:id/cancel', optionalAuth, (req, res) => {
  const order = orderModel.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
  const accessToken = req.headers['x-order-token'] || req.body.accessToken;
  if (!orderModel.canAccess(order, req.member, accessToken) || (req.member && req.member.role === 'admin')) return res.status(403).json({ success: false, message: '无权操作' });
  if (!['pending','payment_submitted'].includes(order.status)) return res.status(400).json({ success: false, message: '当前状态不可取消' });
  const result = orderModel.updateStatus(req.params.id, 'cancelled');
  res.json({ success: true, order: result.order });
});

module.exports = router;
