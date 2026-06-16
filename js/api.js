const API_HOST = window.location.protocol === 'file:'
  ? 'http://localhost:3000'
  : '';

const BASE_PATH = window.location.hostname.includes('github.io') ? '/qevora-studio' : '';

const Utils = {
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
  }
};

const API = {
  baseUrl: API_HOST + '/api',

  _isDemo() {
    return window.location.hostname.includes('github.io');
  },

  _mockRequest(method, path, body) {
    const ok = (data) => ({ success: true, ...data });
    const fail = (msg) => ({ success: false, message: msg });

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
      return ok({ token: email, user: { email, nickname: user.nickname } });
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
      localStorage.setItem('lb_member', JSON.stringify({ email: user.email, nickname: user.nickname }));
      return ok({ token: email, user: { email: user.email, nickname: user.nickname } });
    }

    // ========== Auth: Get current user ==========
    if (method === 'GET' && path === '/auth/me') {
      const token = localStorage.getItem('lb_token');
      if (!token) return fail('未登录');
      const member = localStorage.getItem('lb_member');
      if (!member) return fail('用户信息丢失');
      return ok({ user: JSON.parse(member) });
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
      localStorage.setItem('lb_member', JSON.stringify({ email, nickname: user.nickname }));
      return ok({ token: email, user: { email, nickname: user.nickname } });
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
