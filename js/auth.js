const Auth = {
  getToken() {
    return localStorage.getItem('lb_token');
  },

  getMember() {
    try {
      return JSON.parse(localStorage.getItem('lb_member'));
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  async login(email, password) {
    const res = await API.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('lb_token', res.token);
      localStorage.setItem('lb_member', JSON.stringify(res.member));
    }
    return res;
  },

  async loginSms(email, code) {
    const res = await API.post('/auth/login-sms', { email, code });
    if (res.success) {
      localStorage.setItem('lb_token', res.token);
      localStorage.setItem('lb_member', JSON.stringify(res.member));
    }
    return res;
  },

  async register(email, password, code, nickname) {
    const res = await API.post('/auth/register', { email, password, code, nickname });
    if (res.success) {
      localStorage.setItem('lb_token', res.token);
      localStorage.setItem('lb_member', JSON.stringify(res.member));
    }
    return res;
  },

  async sendSmsCode(email, type = 'register') {
    return await API.post('/email/send', { email, type });
  },

  logout() {
    localStorage.removeItem('lb_token');
    localStorage.removeItem('lb_member');
    localStorage.removeItem('lb_guest_cart');
    window.location.href = Utils.resolvePath('/index.html');
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = Utils.resolvePath('/login.html');
      return false;
    }
    return true;
  },

  async checkAuth() {
    if (!this.getToken()) return false;
    const res = await API.get('/auth/me', true);
    if (res.success) {
      const member = res.member || res.user || null;
      if (member) localStorage.setItem('lb_member', JSON.stringify(member));
      return true;
    }
    localStorage.removeItem('lb_token');
    localStorage.removeItem('lb_member');
    return false;
  },

  updateNavUI() {
    const navIcons = document.querySelector('.nav-icons');
    if (!navIcons) return;

    // Remove existing auth/cart elements
    const oldCart = document.getElementById('navCartBtn');
    const oldUser = document.getElementById('navUserBtn');
    if (oldCart) oldCart.remove();
    if (oldUser) oldUser.remove();

    const member = this.getMember();

    // Cart button
    const cartLink = document.createElement('a');
    cartLink.id = 'navCartBtn';
    cartLink.href = Utils.resolvePath('/cart.html');
    cartLink.className = 'nav-action-btn';
    cartLink.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="cart-badge" id="cartBadge" style="display:none">0</span>`;
    navIcons.insertBefore(cartLink, navIcons.firstChild);

    // User button
    const userDiv = document.createElement('div');
    userDiv.id = 'navUserBtn';
    userDiv.className = 'nav-user-btn';
    if (member) {
      userDiv.innerHTML = `<span class="nav-user-name">${member.nickname || member.email}</span><a href="javascript:void(0)" onclick="Auth.logout()" class="nav-logout">退出</a>`;
    } else {
      userDiv.innerHTML = `<a href="${Utils.resolvePath('/login.html')}" class="nav-login-link">登录</a>`;
    }
    navIcons.insertBefore(userDiv, navIcons.firstChild);

    // Update cart badge
    if (typeof Cart !== 'undefined') Cart.renderBadge();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavUI();
});
