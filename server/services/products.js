const fs = require('fs');
const path = require('path');
const config = require('../config');

function readProducts() {
  const filePath = path.join(config.projectRoot, 'data', 'products.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function findProduct(productId, brandSlug) {
  const data = readProducts();
  const collection = data[brandSlug];
  if (!collection || !Array.isArray(collection.products)) return null;
  const product = collection.products.find(p => String(p.id) === String(productId));
  if (!product) return null;
  return { collection, product };
}

function parsePriceToCny(price) {
  if (typeof price === 'number') return price;
  const str = String(price || '');
  const match = str.replace(/,/g, '').match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Number(match[0]) : 0;
}

function localizeName(name) {
  if (name && typeof name === 'object') return name.zh || name.en || Object.values(name)[0] || '';
  return String(name || '');
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: '购物车为空' };
  const normalized = [];
  let total = 0;
  for (const raw of items) {
    const quantity = Math.max(1, Math.min(parseInt(raw.quantity || 1, 10) || 1, 99));
    const found = findProduct(raw.productId, raw.brandSlug);
    if (!found) return { error: '商品不存在或已下架' };
    const unitPrice = parsePriceToCny(found.product.price);
    total += unitPrice * quantity;
    normalized.push({
      productId: found.product.id,
      brandSlug: found.collection.slug,
      name: localizeName(found.product.name),
      price: typeof found.product.price === 'number' ? `¥${found.product.price}` : found.product.price,
      unitPrice,
      image: found.product.image || '',
      quantity,
      specs: { color: found.product.color || '', size: found.product.size || '', ...(raw.specs || {}) }
    });
  }
  return { items: normalized, totalAmount: total, totalAmountText: `¥${total.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` };
}

module.exports = { readProducts, findProduct, normalizeOrderItems, parsePriceToCny };
