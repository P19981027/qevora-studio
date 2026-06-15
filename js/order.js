const Order = {
  statusLabels: {
    pending: '待确认',
    payment_submitted: '待核验',
    confirmed: '已确认',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已完成',
    cancelled: '已取消'
  },

  async create(address, items, totalAmount, remark = '') {
    return await API.post('/orders', { address, items, totalAmount, remark }, Auth.isLoggedIn());
  },

  async getList(page = 1, pageSize = 10, status = '') {
    const params = new URLSearchParams({ page, pageSize });
    if (status) params.set('status', status);
    return await API.get(`/orders?${params}`, true);
  },

  _getGuestOrderToken(id) {
    return localStorage.getItem('qv_order_' + id) || '';
  },

  async getDetail(id) {
    const guestToken = this._getGuestOrderToken(id);
    if (!Auth.isLoggedIn() && guestToken) {
      const res = await fetch(API.baseUrl + `/orders/${id}`, { headers: { 'X-Order-Token': guestToken } });
      return await res.json();
    }
    return await API.get(`/orders/${id}`, true);
  },

  async cancel(id) {
    const guestToken = this._getGuestOrderToken(id);
    if (!Auth.isLoggedIn() && guestToken) {
      const res = await fetch(API.baseUrl + `/orders/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Order-Token': guestToken },
        body: JSON.stringify({ accessToken: guestToken })
      });
      return await res.json();
    }
    return await API.put(`/orders/${id}/cancel`, {}, true);
  },

  getStatusLabel(status) {
    return this.statusLabels[status] || status;
  },

  getStatusClass(status) {
    const map = {
      pending: 'order-status-pending',
      payment_submitted: 'order-status-pending',
      confirmed: 'order-status-confirmed',
      processing: 'order-status-processing',
      shipped: 'order-status-shipped',
      delivered: 'order-status-delivered',
      cancelled: 'order-status-cancelled'
    };
    return map[status] || '';
  }
};
