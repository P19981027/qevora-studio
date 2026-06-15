const JsonStore = require('./json-store');
const crypto = require('crypto');

class OrderModel {
  constructor() { this.store = new JsonStore('orders.json'); }
  _read() { return this.store.read() || { orders: [], nextId: 1 }; }
  _write(data) { this.store.write(data); }

  create(orderData) {
    const data = this._read();
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const isGuest = !orderData.memberId;
    const order = {
      id: `o_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNo: `QV${dateStr}${rand}`,
      memberId: orderData.memberId || null,
      memberEmail: orderData.memberEmail || '',
      guestAccessToken: isGuest ? crypto.randomBytes(24).toString('hex') : '',
      items: orderData.items,
      totalAmount: orderData.totalAmountText,
      totalAmountNumber: orderData.totalAmount,
      address: orderData.address,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: '',
      paymentTxid: '',
      paymentSubmittedAt: '',
      remark: orderData.remark || '',
      trackingNo: '',
      trackingCompany: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    data.orders.push(order);
    data.nextId++;
    this._write(data);
    return order;
  }

  publicOrder(order) {
    if (!order) return null;
    const { guestAccessToken, ...safe } = order;
    return safe;
  }
  findById(id) { const data = this._read(); return data.orders.find(o => o.id === id) || null; }
  findByOrderNo(orderNo) { const data = this._read(); return data.orders.find(o => o.orderNo === orderNo) || null; }
  canAccess(order, member, accessToken) {
    if (!order) return false;
    if (member && (order.memberId === member.id || member.role === 'admin')) return true;
    if (!order.memberId && accessToken && order.guestAccessToken && accessToken === order.guestAccessToken) return true;
    return false;
  }
  list({ page = 1, pageSize = 20, status = '', memberId = '', orderNo = '' } = {}) {
    const data = this._read();
    let orders = [...data.orders];
    if (status) orders = orders.filter(o => o.status === status || o.paymentStatus === status);
    if (memberId) orders = orders.filter(o => o.memberId === memberId);
    if (orderNo) orders = orders.filter(o => o.orderNo.includes(orderNo));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = orders.length;
    const start = (page - 1) * pageSize;
    return { orders: orders.slice(start, start + pageSize).map(o => this.publicOrder(o)), total, page, pageSize };
  }
  listByMember(memberId, opts = {}) { return this.list({ ...opts, memberId }); }
  updateStatus(id, status) {
    const data = this._read();
    const order = data.orders.find(o => o.id === id);
    if (!order) return { error: '订单不存在' };
    order.status = status;
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status)) order.paymentStatus = 'paid';
    if (status === 'cancelled' && order.paymentStatus !== 'paid') order.paymentStatus = 'cancelled';
    order.updatedAt = new Date().toISOString();
    this._write(data); return { order: this.publicOrder(order) };
  }
  updateTracking(id, trackingNo, trackingCompany) {
    const data = this._read();
    const order = data.orders.find(o => o.id === id);
    if (!order) return { error: '订单不存在' };
    order.trackingNo = trackingNo; order.trackingCompany = trackingCompany;
    if (trackingNo && ['pending','confirmed','processing'].includes(order.status)) order.status = 'shipped';
    order.updatedAt = new Date().toISOString();
    this._write(data); return { order: this.publicOrder(order) };
  }
  submitPayment(id, txid, method = 'USDT-TRC20') {
    const data = this._read();
    const order = data.orders.find(o => o.id === id);
    if (!order) return { error: '订单不存在' };
    if (['paid', 'confirmed'].includes(order.paymentStatus) || order.status === 'confirmed') return { error: '该订单已提交或已确认' };
    order.paymentStatus = 'submitted';
    order.status = 'payment_submitted';
    order.paymentTxid = txid;
    order.paymentMethod = method;
    order.paymentSubmittedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    this._write(data);
    return { order: this.publicOrder(order) };
  }
  count() { return this._read().orders.length; }
  countByStatus(status) { return this._read().orders.filter(o => o.status === status || o.paymentStatus === status).length; }
}
module.exports = new OrderModel();
