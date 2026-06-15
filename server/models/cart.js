const JsonStore = require('./json-store');

class CartModel {
  constructor() {
    this.store = new JsonStore('carts.json');
  }

  _read() {
    return this.store.read() || {};
  }

  _write(data) {
    this.store.write(data);
  }

  getCart(memberId) {
    const carts = this._read();
    return carts[memberId] || [];
  }

  addItem(memberId, item) {
    const carts = this._read();
    if (!carts[memberId]) carts[memberId] = [];
    const existing = carts[memberId].find(
      i => i.productId === item.productId && i.brandSlug === item.brandSlug
    );
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      carts[memberId].push({
        ...item,
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString()
      });
    }
    this._write(carts);
    return carts[memberId];
  }

  updateItem(memberId, productId, brandSlug, quantity) {
    const carts = this._read();
    if (!carts[memberId]) return [];
    const item = carts[memberId].find(
      i => i.productId === productId && i.brandSlug === brandSlug
    );
    if (item) {
      if (quantity <= 0) {
        carts[memberId] = carts[memberId].filter(
          i => !(i.productId === productId && i.brandSlug === brandSlug)
        );
      } else {
        item.quantity = quantity;
      }
    }
    this._write(carts);
    return carts[memberId];
  }

  removeItem(memberId, productId, brandSlug) {
    const carts = this._read();
    if (!carts[memberId]) return [];
    carts[memberId] = carts[memberId].filter(
      i => !(i.productId === productId && i.brandSlug === brandSlug)
    );
    this._write(carts);
    return carts[memberId];
  }

  clearCart(memberId) {
    const carts = this._read();
    carts[memberId] = [];
    this._write(carts);
    return [];
  }

  removeItems(memberId, items) {
    const carts = this._read();
    if (!carts[memberId]) return;
    const keys = new Set(items.map(i => `${i.productId}_${i.brandSlug}`));
    carts[memberId] = carts[memberId].filter(
      i => !keys.has(`${i.productId}_${i.brandSlug}`)
    );
    this._write(carts);
  }
}

module.exports = new CartModel();
