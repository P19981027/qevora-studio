const express = require('express');
const router = express.Router();
const config = require('../config');
const orderModel = require('../models/order');
const optionalAuth = require('../middleware/optional-auth');

function getAccessToken(req) { return req.headers['x-order-token'] || req.query.accessToken || (req.body && req.body.accessToken); }
function validTxid(txid) { return typeof txid === 'string' && /^[A-Za-z0-9]{10,128}$/.test(txid.trim()); }

router.get('/info/:orderId', optionalAuth, (req, res) => {
  const order = orderModel.findById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
  if (!orderModel.canAccess(order, req.member, getAccessToken(req))) return res.status(403).json({ success: false, message: '无权查看支付信息' });
  const cnyAmount = Number(order.totalAmountNumber || 0);
  const usdtAmount = cnyAmount > 0 ? (cnyAmount / config.usdt.rate).toFixed(2) : '0.00';
  res.json({
    success: true,
    order: { id: order.id, orderNo: order.orderNo, totalAmount: order.totalAmount, status: order.status, paymentStatus: order.paymentStatus },
    payment: { address: config.usdt.address, network: config.usdt.network, usdtAmount, rate: config.usdt.rate }
  });
});

router.post('/confirm', optionalAuth, (req, res) => {
  const { orderId, txid } = req.body;
  if (!orderId || !validTxid(txid)) return res.status(400).json({ success: false, message: '请提供有效的交易哈希' });
  const order = orderModel.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
  if (!orderModel.canAccess(order, req.member, getAccessToken(req))) return res.status(403).json({ success: false, message: '无权提交该订单支付信息' });
  const result = orderModel.submitPayment(orderId, txid.trim(), `USDT-${config.usdt.network}`);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: '支付信息已提交，等待后台核验', order: result.order });
});

module.exports = router;
