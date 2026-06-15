const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const cartModel = require('../models/cart');
const { findProduct } = require('../services/products');

function localizedName(name) { return name && typeof name === 'object' ? (name.zh || name.en || Object.values(name)[0] || '') : String(name || ''); }

router.get('/', authMiddleware, (req, res) => {
  const items = cartModel.getCart(req.member.id);
  res.json({ success: true, items });
});

router.post('/add', authMiddleware, (req, res) => {
  const { productId, brandSlug, quantity, specs } = req.body;
  if (!productId || !brandSlug) return res.status(400).json({ success: false, message: '缺少商品信息' });
  const found = findProduct(productId, brandSlug);
  if (!found) return res.status(404).json({ success: false, message: '商品不存在或已下架' });
  const product = found.product;
  const qty = Math.max(1, Math.min(parseInt(quantity || 1, 10) || 1, 99));
  const items = cartModel.addItem(req.member.id, {
    productId: product.id, brandSlug: found.collection.slug, name: localizedName(product.name),
    price: typeof product.price === 'number' ? `¥${product.price}` : product.price, image: product.image || '', quantity: qty,
    specs: { color: product.color || '', size: product.size || '', ...(specs || {}) }
  });
  res.json({ success: true, items });
});

router.put('/update', authMiddleware, (req, res) => {
  const { productId, brandSlug, quantity } = req.body;
  if (!productId || !brandSlug || quantity === undefined) return res.status(400).json({ success: false, message: '缺少参数' });
  const qty = Math.max(0, Math.min(parseInt(quantity, 10) || 0, 99));
  const items = cartModel.updateItem(req.member.id, productId, brandSlug, qty);
  res.json({ success: true, items });
});

router.delete('/remove', authMiddleware, (req, res) => {
  const { productId, brandSlug } = req.body || {};
  if (!productId || !brandSlug) return res.status(400).json({ success: false, message: '缺少参数' });
  const items = cartModel.removeItem(req.member.id, productId, brandSlug);
  res.json({ success: true, items });
});

router.delete('/clear', authMiddleware, (req, res) => {
  const items = cartModel.clearCart(req.member.id);
  res.json({ success: true, items });
});

module.exports = router;
