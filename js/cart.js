const Cart = {
  async getItems() {
    if (Auth.isLoggedIn()) {
      const res = await API.get('/cart', true);
      return res.success ? res.items : [];
    }
    return this._getGuestCart();
  },

  _getGuestCart() {
    try {
      return JSON.parse(localStorage.getItem('lb_guest_cart')) || [];
    } catch { return []; }
  },

  _saveGuestCart(items) {
    localStorage.setItem('lb_guest_cart', JSON.stringify(items));
  },

  async add(productId, brandSlug, name, price, image, quantity = 1, specs = {}) {
    if (Auth.isLoggedIn()) {
      const res = await API.post('/cart/add', { productId, brandSlug, name, price, image, quantity, specs }, true);
      if (res.success) {
        this.renderBadge(res.items);
        return res;
      }
      return res;
    }
    // Guest cart
    const items = this._getGuestCart();
    const existing = items.find(i => i.productId === productId && i.brandSlug === brandSlug);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, brandSlug, name, price, image, quantity, specs, addedAt: new Date().toISOString() });
    }
    this._saveGuestCart(items);
    this.renderBadge(items);
    return { success: true, items };
  },

  async update(productId, brandSlug, quantity) {
    if (Auth.isLoggedIn()) {
      const res = await API.put('/cart/update', { productId, brandSlug, quantity }, true);
      if (res.success) this.renderBadge(res.items);
      return res;
    }
    const items = this._getGuestCart();
    const item = items.find(i => i.productId === productId && i.brandSlug === brandSlug);
    if (item) {
      if (quantity <= 0) {
        const filtered = items.filter(i => !(i.productId === productId && i.brandSlug === brandSlug));
        this._saveGuestCart(filtered);
        this.renderBadge(filtered);
        return { success: true, items: filtered };
      }
      item.quantity = quantity;
    }
    this._saveGuestCart(items);
    this.renderBadge(items);
    return { success: true, items };
  },

  async remove(productId, brandSlug) {
    if (Auth.isLoggedIn()) {
      const res = await API.delete('/cart/remove', { productId, brandSlug }, true);
      if (res.success) this.renderBadge(res.items);
      return res;
    }
    const items = this._getGuestCart().filter(i => !(i.productId === productId && i.brandSlug === brandSlug));
    this._saveGuestCart(items);
    this.renderBadge(items);
    return { success: true, items };
  },

  async mergeGuestCart() {
    const guestItems = this._getGuestCart();
    if (!guestItems.length) return;
    for (const item of guestItems) {
      await API.post('/cart/add', item, true);
    }
    localStorage.removeItem('lb_guest_cart');
  },

  getTotal(items) {
    if (!items || !items.length) return '¥0';
    let total = 0;
    items.forEach(item => {
      const priceStr = String(item.price).replace(/[¥,，\s]/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price)) total += price * (item.quantity || 1);
    });
    return '¥' + total.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },

  renderBadge(items) {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = (items || this._getGuestCart()).reduce((sum, i) => sum + (i.quantity || 1), 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  },

  async renderBadgeFromServer() {
    if (Auth.isLoggedIn()) {
      const res = await API.get('/cart', true);
      if (res.success) this.renderBadge(res.items);
    } else {
      this.renderBadge();
    }
  }
};
