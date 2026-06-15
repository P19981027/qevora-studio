const API_HOST = window.location.protocol === 'file:'
  ? 'http://localhost:3000'
  : '';

const Utils = {
  resolvePath(targetPath) {
    if (window.location.protocol === 'file:') {
      if (window.location.pathname.includes('/pages/')) {
        return '../../' + targetPath.replace(/^\//, '');
      }
      return targetPath.replace(/^\//, '');
    }
    return targetPath;
  }
};

const API = {
  baseUrl: API_HOST + '/api',

  async request(method, path, body = null, auth = false) {
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
