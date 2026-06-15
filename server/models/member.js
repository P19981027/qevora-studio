const JsonStore = require('./json-store');
const bcrypt = require('bcryptjs');

class MemberModel {
  constructor() {
    this.store = new JsonStore('members.json');
  }

  _read() {
    return this.store.read() || { members: [], nextId: 1 };
  }

  _write(data) {
    this.store.write(data);
  }

  findByEmail(email) {
    const data = this._read();
    return data.members.find(m => m.email === email) || null;
  }

  findById(id) {
    const data = this._read();
    return data.members.find(m => m.id === id) || null;
  }

  async create({ email, password, nickname, role = 'member' }) {
    const data = this._read();
    if (data.members.find(m => m.email === email)) {
      return { error: '该邮箱已注册' };
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const member = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      passwordHash,
      nickname: nickname || '',
      role,
      defaultAddress: null,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    data.members.push(member);
    data.nextId++;
    this._write(data);
    const { passwordHash: _, ...safe } = member;
    return { member: safe };
  }

  async verifyPassword(email, password) {
    const member = this.findByEmail(email);
    if (!member) return { error: '邮箱未注册' };
    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) return { error: '密码错误' };
    return { member };
  }

  updateLastLogin(id) {
    const data = this._read();
    const member = data.members.find(m => m.id === id);
    if (member) {
      member.lastLoginAt = new Date().toISOString();
      this._write(data);
    }
  }

  updateProfile(id, updates) {
    const data = this._read();
    const member = data.members.find(m => m.id === id);
    if (!member) return { error: '会员不存在' };
    if (updates.nickname !== undefined) member.nickname = updates.nickname;
    if (updates.defaultAddress !== undefined) member.defaultAddress = updates.defaultAddress;
    if (updates.addresses !== undefined) member.addresses = updates.addresses;
    if (updates.password) {
      member.passwordHash = updates.passwordHash;
    }
    member.updatedAt = new Date().toISOString();
    this._write(data);
    const { passwordHash: _, ...safe } = member;
    return { member: safe };
  }

  list({ page = 1, pageSize = 20, search = '' } = {}) {
    const data = this._read();
    let members = data.members.map(m => {
      const { passwordHash, ...safe } = m;
      return safe;
    });
    if (search) {
      const q = search.toLowerCase();
      members = members.filter(m => m.email.includes(q) || (m.nickname && m.nickname.toLowerCase().includes(q)));
    }
    members.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = members.length;
    const start = (page - 1) * pageSize;
    return { members: members.slice(start, start + pageSize), total, page, pageSize };
  }

  getMemberWithOrders(id, orders) {
    const data = this._read();
    const member = data.members.find(m => m.id === id);
    if (!member) return null;
    const { passwordHash, ...safe } = member;
    const memberOrders = orders.filter(o => o.memberId === id);
    return { member: safe, orders: memberOrders };
  }

  count() {
    const data = this._read();
    return data.members.length;
  }
}

module.exports = new MemberModel();