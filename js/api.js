const API_HOST = window.location.protocol === 'file:'
  ? 'http://localhost:3000'
  : '';

const BASE_PATH = window.location.hostname.includes('github.io') ? '/qevora-studio' : '';

const Utils = {
  _webpSupported: null,

  async checkWebP() {
    if (this._webpSupported !== null) return this._webpSupported;
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this._webpSupported = img.width > 0; resolve(this._webpSupported); };
      img.onerror = () => { this._webpSupported = false; resolve(false); };
      img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    });
  },

  resolvePath(targetPath) {
    if (window.location.protocol === 'file:') {
      if (window.location.pathname.includes('/pages/')) {
        return '../../' + targetPath.replace(/^\//, '');
      }
      return targetPath.replace(/^\//, '');
    }
    return BASE_PATH + targetPath;
  },

  resolveImage(imgPath) {
    if (window.location.protocol === 'file:') {
      if (window.location.pathname.includes('/pages/')) {
        return '../../' + imgPath.replace(/^\//, '');
      }
      return imgPath.replace(/^\//, '');
    }
    return BASE_PATH + '/' + imgPath.replace(/^\//, '');
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};

// Global WebP fallback: if a .webp image fails to load, try the original .jpg
document.addEventListener('error', function(e) {
  const el = e.target;
  if (el.tagName === 'IMG' && el.src && el.src.endsWith('.webp') && !el.dataset.webpFallback) {
    el.dataset.webpFallback = '1';
    el.src = el.src.replace(/\.webp$/i, '.jpg');
  }
}, true);

const API = {
  baseUrl: API_HOST + '/api',

  _isDemo() {
    const host = window.location.hostname;
    return host.includes('github.io') || host.includes('pages.dev') || window.location.protocol === 'file:';
  },

  _mockRequest(method, path, body) {
    const ok = (data) => ({ success: true, ...data });
    const fail = (msg) => ({ success: false, message: msg });

    // ========== Demo: Seed default admin user on first visit ==========
    if (!localStorage.getItem('lb_users')) {
      localStorage.setItem('lb_users', JSON.stringify([
        { email: 'admin@qevora.com', password: 'admin123', nickname: 'Admin', role: 'admin' }
      ]));
    } else {
      // Migration: ensure existing users have role field
      try {
        let users = JSON.parse(localStorage.getItem('lb_users')) || [];
        let changed = false;
        users.forEach(u => { if (!u.role) { u.role = u.email === 'admin@qevora.com' ? 'admin' : 'user'; changed = true; } });
        if (changed) localStorage.setItem('lb_users', JSON.stringify(users));
      } catch (e) {}
    }

    // ========== Auth: Register ==========
    if (method === 'POST' && path === '/auth/register') {
      const { email, password, nickname } = body || {};
      if (!email || !password) return fail('邮箱和密码不能为空');
      let users = [];
      try { users = JSON.parse(localStorage.getItem('lb_users')) || []; } catch (e) {}
      if (users.find(u => u.email === email)) return fail('该邮箱已注册');
      const user = { email, password, nickname: nickname || email };
      users.push(user);
      localStorage.setItem('lb_users', JSON.stringify(users));
      localStorage.setItem('lb_token', email);
      localStorage.setItem('lb_member', JSON.stringify({ email, nickname: user.nickname }));
      return ok({ token: email, member: { email, nickname: user.nickname } });
    }

    // ========== Auth: Login ==========
    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = body || {};
      if (!email || !password) return fail('邮箱和密码不能为空');
      let users = [];
      try { users = JSON.parse(localStorage.getItem('lb_users')) || []; } catch (e) {}
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return fail('邮箱或密码错误');
      localStorage.setItem('lb_token', email);
      localStorage.setItem('lb_member', JSON.stringify({ email: user.email, nickname: user.nickname, role: user.role || '' }));
      return ok({ token: email, member: { email: user.email, nickname: user.nickname, role: user.role || '' } });
    }

    // ========== Auth: Get current user ==========
    if (method === 'GET' && path === '/auth/me') {
      const token = localStorage.getItem('lb_token');
      if (!token) return fail('未登录');
      const member = localStorage.getItem('lb_member');
      if (!member) return fail('用户信息丢失');
      return ok({ member: JSON.parse(member) });
    }

    // ========== Auth: SMS login (demo: code 123456) ==========
    if (method === 'POST' && path === '/auth/login-sms') {
      const { phone, code } = body || {};
      if (code !== '123456') return fail('验证码错误（演示模式请输入 123456）');
      const email = phone || 'demo@demo.com';
      let users = [];
      try { users = JSON.parse(localStorage.getItem('lb_users')) || []; } catch (e) {}
      let user = users.find(u => u.email === email);
      if (!user) {
        user = { email, password: '123456', nickname: email };
        users.push(user);
        localStorage.setItem('lb_users', JSON.stringify(users));
      }
      localStorage.setItem('lb_token', email);
      localStorage.setItem('lb_member', JSON.stringify({ email, nickname: user.nickname, role: user.role || '' }));
      return ok({ token: email, member: { email, nickname: user.nickname, role: user.role || '' } });
    }

    // ========== Cart mock (for demo mode logged-in users) ==========
    const getCart = () => { try { return JSON.parse(localStorage.getItem('lb_demo_cart')) || []; } catch (e) { return []; } };
    const saveCart = (items) => localStorage.setItem('lb_demo_cart', JSON.stringify(items));

    if (method === 'GET' && path === '/cart') {
      return ok({ items: getCart() });
    }
    if (method === 'POST' && path === '/cart/add') {
      const items = getCart();
      const p = body || {};
      const existing = items.find(i => i.productId === p.productId && i.brandSlug === p.brandSlug);
      if (existing) {
        existing.quantity += (p.quantity || 1);
      } else {
        items.push({ productId: p.productId, brandSlug: p.brandSlug, name: p.name, price: p.price, image: p.image, quantity: p.quantity || 1, specs: p.specs, addedAt: new Date().toISOString() });
      }
      saveCart(items);
      return ok({ items });
    }
    if (method === 'PUT' && path === '/cart/update') {
      const items = getCart();
      const p = body || {};
      if (p.quantity <= 0) {
        const filtered = items.filter(i => !(i.productId === p.productId && i.brandSlug === p.brandSlug));
        saveCart(filtered);
        return ok({ items: filtered });
      }
      const item = items.find(i => i.productId === p.productId && i.brandSlug === p.brandSlug);
      if (item) item.quantity = p.quantity;
      saveCart(items);
      return ok({ items });
    }
    if (method === 'DELETE' && path === '/cart/remove') {
      const items = getCart();
      const p = body || {};
      const filtered = items.filter(i => !(i.productId === p.productId && i.brandSlug === p.brandSlug));
      saveCart(filtered);
      return ok({ items: filtered });
    }
    if (method === 'DELETE' && path === '/cart/clear') {
      saveCart([]);
      return ok({ items: [] });
    }

    // ========== Email mock (demo: auto-approve) ==========
    if (method === 'POST' && path === '/email/send') {
      return ok({ message: '验证码已发送（演示模式）', code: '123456' });
    }

    // ========== Orders mock ==========
    const getOrders = () => { try { return JSON.parse(localStorage.getItem('lb_demo_orders')) || []; } catch (e) { return []; } };
    const saveOrders = (orders) => localStorage.setItem('lb_demo_orders', JSON.stringify(orders));

    if (method === 'POST' && path === '/orders') {
      const { address, items, remark } = body || {};
      const id = 'order_' + Date.now();
      const orderNo = 'QV' + Date.now().toString().slice(-8);
      const totalAmount = (items || []).reduce((sum, i) => {
        const p = parseFloat(String(i.price).replace(/[¥,，\s]/g, ''));
        return sum + (isNaN(p) ? 0 : p * (i.quantity || 1));
      }, 0);
      const totalAmountText = '¥' + totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      const guestAccessToken = 'gat_' + Math.random().toString(36).slice(2);
      const order = {
        id, orderNo, memberId: null, memberEmail: '',
        items: items || [], totalAmount: totalAmountText, address: address || {},
        remark: remark || '', status: 'pending', guestAccessToken,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      const orders = getOrders();
      orders.unshift(order);
      saveOrders(orders);
      return ok({ order: { id, orderNo, totalAmount: totalAmountText, status: 'pending', createdAt: order.createdAt }, accessToken: guestAccessToken });
    }
    if (method === 'GET' && path.startsWith('/orders?')) {
      return ok({ orders: getOrders(), page: 1, totalPages: 1, total: getOrders().length });
    }
    if (method === 'GET' && path.match(/^\/orders\/[^?]/)) {
      const id = path.split('/orders/')[1].split('?')[0];
      const order = getOrders().find(o => o.id === id);
      if (!order) return fail('订单不存在');
      return ok({ order });
    }
    if (method === 'PUT' && path.match(/^\/orders\/[^/]+\/cancel$/)) {
      const id = path.split('/orders/')[1].replace('/cancel', '');
      const orders = getOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return fail('订单不存在');
      order.status = 'cancelled';
      order.updatedAt = new Date().toISOString();
      saveOrders(orders);
      return ok({ order });
    }

    // ========== Payment mock ==========
    if (method === 'GET' && path.startsWith('/payment/info/')) {
      const id = path.split('/payment/info/')[1];
      const orders = getOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return fail('订单不存在');
      return ok({
        order: { orderNo: order.orderNo, totalAmount: order.totalAmount },
        payment: { usdtAmount: '1.00', address: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', network: 'TRC20', rate: '7.25' }
      });
    }
    if (method === 'POST' && path === '/payment/confirm') {
      const { orderId, txid } = body || {};
      const orders = getOrders();
      const order = orders.find(o => o.id === orderId);
      if (!order) return fail('订单不存在');
      order.status = 'payment_submitted';
      order.txid = txid;
      order.updatedAt = new Date().toISOString();
      saveOrders(orders);
      return ok({ message: '支付信息已提交' });
    }

    // ========== Admin mock ==========
    if (method === 'GET' && path === '/admin/members') {
      let users = [];
      try { users = JSON.parse(localStorage.getItem('lb_users')) || []; } catch (e) {}
      const members = users.map(u => ({ id: u.email, email: u.email, nickname: u.nickname, role: u.role || 'user', createdAt: new Date().toISOString() }));
      return ok({ members, page: 1, totalPages: 1, total: members.length });
    }
    if (method === 'GET' && path.match(/^\/admin\/members\//)) {
      const id = path.split('/admin/members/')[1];
      let users = [];
      try { users = JSON.parse(localStorage.getItem('lb_users')) || []; } catch (e) {}
      const u = users.find(x => x.email === id);
      if (!u) return fail('会员不存在');
      return ok({ member: { id: u.email, email: u.email, nickname: u.nickname, role: u.role || 'user', createdAt: new Date().toISOString() }, orders: [] });
    }
    if (method === 'GET' && path === '/admin/orders') {
      return ok({ orders: getOrders(), page: 1, totalPages: 1, total: getOrders().length });
    }
    if (method === 'GET' && path.match(/^\/admin\/orders\//)) {
      const id = path.split('/admin/orders/')[1];
      const order = getOrders().find(o => o.id === id);
      if (!order) return fail('订单不存在');
      return ok({ order });
    }
    if (method === 'PUT' && path.match(/^\/admin\/orders\/[^/]+\/status$/)) {
      const id = path.split('/admin/orders/')[1].replace('/status', '');
      const { status } = body || {};
      const orders = getOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return fail('订单不存在');
      order.status = status;
      order.updatedAt = new Date().toISOString();
      saveOrders(orders);
      return ok({ order });
    }
    if (method === 'PUT' && path.match(/^\/admin\/orders\/[^/]+\/tracking$/)) {
      const id = path.split('/admin/orders/')[1].replace('/tracking', '');
      const { trackingNo, trackingCompany } = body || {};
      const orders = getOrders();
      const order = orders.find(o => o.id === id);
      if (!order) return fail('订单不存在');
      order.trackingNo = trackingNo;
      order.trackingCompany = trackingCompany || '';
      order.updatedAt = new Date().toISOString();
      saveOrders(orders);
      return ok({ order });
    }
    if (method === 'PUT' && path === '/admin/products/sync') {
      return ok({ message: '演示模式：商品数据已同步到本地' });
    }

    return fail('演示模式不支持此功能');
  },

  async request(method, path, body = null, auth = false) {
    // Demo mode: intercept all /api/ requests with localStorage mock
    if (this._isDemo()) {
      if (auth) {
        const token = localStorage.getItem('lb_token');
        if (!token) {
          window.location.href = Utils.resolvePath('/login.html');
          return { success: false, message: '请先登录' };
        }
      }
      return this._mockRequest(method, path, body);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('lb_token');
      if (!token) {
        window.location.href = Utils.resolvePath('/login.html');
        return { success: false, message: '请先登录' };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    const opts = { method, headers };
    if (body !== null && body !== undefined) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(this.baseUrl + path, opts);
      if (res.status === 401) {
        localStorage.removeItem('lb_token');
        localStorage.removeItem('lb_member');
        window.location.href = Utils.resolvePath('/login.html');
        return { success: false, message: '登录已过期' };
      }
      return await res.json();
    } catch (err) {
      console.error('API error:', err);
      return { success: false, message: '网络错误，请确认服务器已启动 (npm start)' };
    }
  },

  get: (path, auth) => API.request('GET', path, null, auth),
  post: (path, body, auth) => API.request('POST', path, body, auth),
  put: (path, body, auth) => API.request('PUT', path, body, auth),
  delete: (path, body, auth) => API.request('DELETE', path, body, auth)
};
