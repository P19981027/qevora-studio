/**
 * I18n 多语言管理 — 统一版
 * 委托 Language 系统提供翻译，保持向后兼容
 * 语言偏好统一存储在 localStorage['language']
 */
const I18n = {
  current: 'zh',

  validLangs: ['zh','en','ko','ja','fr','es','ar','ru','de','pt','it','th','vi'],

  /** 内部字典：仅在 Language 系统未加载时作为兜底 */
  dict: {
    'checkout.title':            { zh: '确认订单',             en: 'CHECKOUT' },
    'checkout.subtitle':         { zh: 'CHECKOUT',             en: 'CHECKOUT' },
    'checkout.section_items':    { zh: '商品清单',             en: 'ORDER ITEMS' },
    'checkout.section_address':  { zh: '收货地址',             en: 'Shipping Address' },
    'checkout.section_remark':   { zh: '订单备注',             en: 'ORDER REMARK' },
    'form.recipient':            { zh: '收件人',               en: 'Full Name' },
    'form.phone':                { zh: '联系电话',              en: 'Phone' },
    'form.line1':                { zh: '地址 1',               en: 'Address Line 1' },
    'form.line2':                { zh: '地址 2（可选）',       en: 'Address Line 2 (optional)' },
    'form.city':                 { zh: '城市',                 en: 'City' },
    'form.state':                { zh: '省/州',                en: 'State / Province' },
    'form.zip':                  { zh: '邮编',                 en: 'ZIP Code' },
    'ph.recipient':              { zh: '请输入收件人姓名',     en: 'Full name' },
    'ph.phone':                  { zh: '含国家区号',           en: 'e.g. +1 555-0100' },
    'ph.line1':                  { zh: '街道、门牌号等',       en: 'Street, house number, etc.' },
    'ph.line2':                  { zh: '公寓、单元号等',       en: 'Apt, unit, floor, etc.' },
    'ph.city':                   { zh: '城市',                 en: 'City' },
    'ph.state':                  { zh: '省或州',               en: 'State or Province' },
    'ph.zip':                    { zh: '邮政编码',             en: 'Postal code' },
    'ph.remark':                 { zh: '如有特殊要求请备注',   en: 'Special requests (optional)' },
    'btn.submit':                { zh: '提交订单',             en: 'PLACE ORDER' },
    'btn.submitting':            { zh: '提交中...',            en: 'Submitting...' },
    'err.country':               { zh: '请选择国家/地区',      en: 'Please select a country' },
    'err.name':                  { zh: '请输入收件人姓名',     en: 'Please enter name (min 2 characters)' },
    'err.phone':                 { zh: '请输入联系电话',       en: 'Please enter phone number' },
    'err.line1':                 { zh: '请输入详细地址',       en: 'Please enter address (min 5 characters)' },
    'err.city':                  { zh: '请输入城市',           en: 'Please enter city' },
    'err.zip':                   { zh: '请输入邮政编码',       en: 'Please enter postal code' },
    'err.network':               { zh: '网络错误，请稍后重试', en: 'Network error, please retry' },
    'country.select':            { zh: '选择国家/地区',        en: 'Select Country' },
    'hint.prefix':               { zh: '格式参考',             en: 'Format' },
    'login.email':               { zh: '邮箱',                 en: 'Email' },
    'login.password':            { zh: '密码',                 en: 'Password' },
    'login.submit':              { zh: '登 录',                en: 'LOGIN' },
    'login.no_account':          { zh: '还没有账号？',         en: "Don't have an account?" },
    'login.go_register':         { zh: '立即注册',             en: 'Register' },
    'login.ph_email':            { zh: '请输入邮箱地址',       en: 'Email address' },
    'login.ph_password':         { zh: '请输入密码',           en: 'Password' },
    'login.invalid_email':       { zh: '请输入正确的邮箱地址', en: 'Please enter a valid email' },
    'login.empty_pwd':           { zh: '请输入密码',           en: 'Please enter password' },
    'login.logging_in':          { zh: '登录中...',            en: 'Logging in...' },
    'login.failed':              { zh: '登录失败',             en: 'Login failed' },
    'login.network_err':         { zh: '网络错误，请稍后重试', en: 'Network error, please retry' },
    'register.title':            { zh: '会员注册',             en: 'REGISTER' },
    'register.email':            { zh: '邮箱',                 en: 'Email' },
    'register.code':             { zh: '验证码',               en: 'Code' },
    'register.get_code':         { zh: '获取验证码',           en: 'Get Code' },
    'register.nickname':         { zh: '昵称',                 en: 'Nickname' },
    'register.password':         { zh: '密码',                 en: 'Password' },
    'register.confirm':          { zh: '确认密码',             en: 'Confirm Password' },
    'register.submit':           { zh: '注 册',                en: 'REGISTER' },
    'register.has_account':      { zh: '已有账号？',           en: 'Already have an account?' },
    'register.go_login':         { zh: '立即登录',             en: 'Login' },
    'register.ph_email':         { zh: '请输入邮箱地址',       en: 'Email address' },
    'register.ph_code':          { zh: '6位验证码',            en: '6-digit code' },
    'register.ph_nickname':      { zh: '请输入昵称',           en: 'Nickname' },
    'register.ph_password':      { zh: '至少6位密码',          en: 'Min 6 characters' },
    'register.ph_confirm':       { zh: '再次输入密码',         en: 'Re-enter password' },
    'register.send_ok':          { zh: '验证码已发送',         en: 'Code sent' },
    'register.send_fail':        { zh: '发送失败，请稍后再试', en: 'Failed to send, try later' },
    'register.reg_ok':           { zh: '注册成功',             en: 'Registration successful' },
    'register.reg_fail':         { zh: '注册失败',             en: 'Registration failed' },
    'register.weak_pwd':         { zh: '密码长度至少6位',      en: 'Password must be at least 6 characters' },
    'register.pwd_mismatch':     { zh: '两次密码不一致',       en: 'Passwords do not match' },
    'register.network_err':      { zh: '网络错误，请稍后再试', en: 'Network error, please retry' },
    'register.invalid_email':    { zh: '请输入正确的邮箱地址', en: 'Please enter a valid email' },
    'register.invalid_code':     { zh: '请输入6位验证码',      en: 'Please enter 6-digit code' },
    'register.empty_nick':       { zh: '请输入昵称',           en: 'Please enter nickname' },
    'register.registering':      { zh: '注册中...',            en: 'Registering...' },
    'register.network_short':    { zh: '网络错误',             en: 'Network error' },
    'cart.title':                { zh: '购物车',               en: 'CART' },
    'cart.empty':                { zh: '购物车是空的',         en: 'Your cart is empty' },
    'cart.go_shop':              { zh: '去逛逛',               en: 'Shop Now' },
    'cart.total':                { zh: '合计',                 en: 'Total' },
    'cart.checkout':             { zh: '去结算',               en: 'CHECKOUT' },
    'cart.remove':               { zh: '删除',                 en: 'Remove' },
    'cart.clear_all':            { zh: '全部清空',             en: 'Clear All' },
    'cart.browse':               { zh: '浏览商品',             en: 'Browse Products' },
    'cart.subtitle':             { zh: 'SHOPPING CART',        en: 'SHOPPING CART' },
    'orders.title':              { zh: '我的订单',             en: 'MY ORDERS' },
    'orders.subtitle':           { zh: 'MY ORDERS',            en: 'MY ORDERS' },
    'orders.empty':              { zh: '暂无订单',             en: 'No orders yet' },
    'orders.status_pending':     { zh: '待确认',               en: 'Pending' },
    'orders.status_confirmed':   { zh: '已确认',               en: 'Confirmed' },
    'orders.status_processing':  { zh: '处理中',               en: 'Processing' },
    'orders.status_shipped':     { zh: '已发货',               en: 'Shipped' },
    'orders.status_completed':   { zh: '已完成',               en: 'Completed' },
    'orders.status_cancelled':   { zh: '已取消',               en: 'Cancelled' },
    'orders.order_no':           { zh: '订单号',               en: 'Order No.' },
    'orders.date':               { zh: '下单时间',             en: 'Date' },
    'orders.amount':             { zh: '金额',                 en: 'Amount' },
    'orders.status':             { zh: '状态',                 en: 'Status' },
    'orders.action':             { zh: '操作',                 en: 'Action' },
    'orders.view':               { zh: '查看详情',             en: 'View' },
    'orders.pay':                { zh: '去支付',               en: 'Pay' },
    'orders.cancel':             { zh: '取消订单',             en: 'Cancel' },
    'orders.load_fail':          { zh: '加载失败',             en: 'Failed to load' },
    'orders.load_more':          { zh: '加载更多',             en: 'Load More' },
    'orders.not_found':          { zh: '订单不存在',           en: 'Order not found' },
    'orders.back_to_list':       { zh: '← 返回订单列表',       en: '← Back to Orders' },
    'orders.order_info':         { zh: '订单信息',             en: 'Order Info' },
    'orders.tracking_no':        { zh: '快递单号',             en: 'Tracking No.' },
    'orders.remark_label':       { zh: '备注',                 en: 'Remark' },
    'orders.shipping_addr':      { zh: '收货地址',             en: 'Shipping Address' },
    'orders.recipient':          { zh: '收件人',               en: 'Recipient' },
    'orders.phone_label':        { zh: '电话',                 en: 'Phone' },
    'orders.address':            { zh: '地址',                 en: 'Address' },
    'orders.items':              { zh: '商品清单',             en: 'Items' },
    'orders.confirm_cancel':     { zh: '确定要取消此订单吗？', en: 'Confirm cancel this order?' },
    'orders.cancel_fail':        { zh: '取消失败',             en: 'Cancellation failed' },
    'orders.browse':             { zh: '浏览商品',             en: 'Browse Products' },
    'payment.title':             { zh: 'USDT 支付',            en: 'USDT Payment' },
    'payment.order_no':          { zh: '订单号',               en: 'Order No.' },
    'payment.amount':            { zh: '金额',                 en: 'Amount' },
    'payment.rmb_amount':        { zh: '应付金额（人民币）',   en: 'Amount Due (CNY)' },
    'payment.exact_amount':      { zh: '精确金额',             en: 'Exact Amount' },
    'payment.copy_addr':         { zh: '复制地址',             en: 'Copy Address' },
    'payment.wallet_step1':      { zh: '打开您的钱包',         en: 'Open your wallet' },
    'payment.wallet_step2':      { zh: '复制下方 USDT 地址，向该地址转账', en: 'Copy the USDT address below and transfer to it' },
    'payment.wallet_step3':      { zh: '转账完成后，粘贴交易哈希并提交确认', en: 'After transfer, paste the TxID below and submit' },
    'payment.usdt_addr':         { zh: 'USDT 收款地址',        en: 'USDT Address' },
    'payment.warning':           { zh: '请务必注意',           en: 'Important' },
    'payment.warning_text':      { zh: '必须使用 TRC20 网络转账，其他网络将无法到账。转账金额请与上方显示完全一致。', en: 'Must use TRC20 network. Other networks will not be credited. Transfer amount must match exactly.' },
    'payment.txid':              { zh: '交易哈希 (TxID)',      en: 'Transaction Hash (TxID)' },
    'payment.submit':            { zh: '我已支付，提交验证',   en: 'I have paid, submit for verification' },
    'payment.help':              { zh: '支付遇到问题？',       en: 'Payment issue?' },
    'payment.view_order':        { zh: '查看订单',             en: 'View Order' },
    'payment.ph_txid':           { zh: '转账完成后粘贴交易哈希', en: 'Paste TxID after transfer' },
    'payment.copied':            { zh: '已复制',               en: 'Copied' },
    'payment.pending':           { zh: '等待确认中...',        en: 'Awaiting confirmation...' },
    'payment.missing_order':     { zh: '缺少订单参数',         en: 'Missing order parameter' },
    'payment.load_fail':         { zh: '加载支付信息失败',     en: 'Failed to load payment info' },
    'payment.network_retry':     { zh: '网络错误，请刷新重试', en: 'Network error, please refresh' },
    'payment.invalid_txid':      { zh: '请输入有效的交易哈希', en: 'Please enter a valid TxID (min 10 characters)' },
    'payment.submitting':        { zh: '提交中...',            en: 'Submitting...' },
    'payment.submitted':         { zh: '支付信息已提交，客服确认后将更新订单状态', en: 'Payment submitted. Order status will update after review.' },
    'payment.submit_fail':       { zh: '提交失败',             en: 'Submission failed' },
    'payment.network':           { zh: '网络错误',             en: 'Network error' },
    'payment.subtitle_text':     { zh: 'CRYPTOCURRENCY PAYMENT', en: 'CRYPTOCURRENCY PAYMENT' },
    'payment.rate_label':        { zh: 'USDT (TRC20)',         en: 'USDT (TRC20)' },
    'payment.rate_approx':       { zh: '≈',                    en: '≈' },
    'common.site_title':         { zh: 'Qevora Studio',          en: 'Qevora Studio' }
  },

  countries: [
    { code: 'CN', phone: '+86', name: { zh: '中国', en: 'China' }, hint: { zh: 'Line 1: 区/县+街道门牌 | City: 城市名 | State: 省份 | ZIP: 6位数字', en: 'Line 1: District+Street | City | State: Province | ZIP: 6-digit' } },
    { code: 'US', phone: '+1', name: { zh: '美国', en: 'United States' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城市 | State: 2字母 | ZIP: 5位数字', en: 'Line 1: Street+House | City | State: 2-letter | ZIP: 5-digit' } },
    { code: 'GB', phone: '+44', name: { zh: '英国', en: 'United Kingdom' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城镇 | State: 郡 | ZIP: 如 SW1A 1AA', en: 'Line 1: Street+House | City: Town | State: County | ZIP: e.g. SW1A 1AA' } },
    { code: 'JP', phone: '+81', name: { zh: '日本', en: 'Japan' }, hint: { zh: 'Line 1: 町名+番地 | City: 市区町村 | State: 都道府県 | ZIP: 7桁', en: 'Line 1: District+Block | City | State: Prefecture | ZIP: 7-digit' } },
    { code: 'KR', phone: '+82', name: { zh: '韩国', en: 'South Korea' }, hint: { zh: 'Line 1: 道路名+建筑物番号 | City: 市/郡/区 | State: 道 | ZIP: 5자리', en: 'Line 1: Street+Building | City | State: Do | ZIP: 5-digit' } },
    { code: 'FR', phone: '+33', name: { zh: '法国', en: 'France' }, hint: { zh: 'Line 1: Rue+Numéro | City: Ville | State: Région | ZIP: 5位数字', en: 'Line 1: Street+Number | City | State: Region | ZIP: 5-digit' } },
    { code: 'DE', phone: '+49', name: { zh: '德国', en: 'Germany' }, hint: { zh: 'Line 1: Straße+Hausnr. | City: Stadt | State: Bundesland | ZIP: 5位数字', en: 'Line 1: Str.+No. | City | State | ZIP: 5-digit' } },
    { code: 'IT', phone: '+39', name: { zh: '意大利', en: 'Italy' }, hint: { zh: 'Line 1: Via+Numero | City: Città | State: Regione | ZIP: 5位数字', en: 'Line 1: Street+No. | City | State: Region | ZIP: 5-digit' } },
    { code: 'ES', phone: '+34', name: { zh: '西班牙', en: 'Spain' }, hint: { zh: 'Line 1: Calle+Número | City: Ciudad | State: Provincia | ZIP: 5位数字', en: 'Line 1: Street+No. | City | State: Province | ZIP: 5-digit' } },
    { code: 'CA', phone: '+1', name: { zh: '加拿大', en: 'Canada' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城市 | State: 省 | ZIP: A1A 1A1', en: 'Line 1: Street+Number | City | State: Province | ZIP: A1A 1A1' } },
    { code: 'AU', phone: '+61', name: { zh: '澳大利亚', en: 'Australia' }, hint: { zh: 'Line 1: 街道+门牌 | City: 郊区 | State: 如 NSW | ZIP: 4位数字', en: 'Line 1: Street+Number | City: Suburb | State: e.g. NSW | ZIP: 4-digit' } },
    { code: 'SG', phone: '+65', name: { zh: '新加坡', en: 'Singapore' }, hint: { zh: 'Line 1: 街区+街道 | City: 区域 | State: — | ZIP: 6位数字', en: 'Line 1: Block+Street | City: Planning Area | ZIP: 6-digit' } },
    { code: 'HK', phone: '+852', name: { zh: '香港', en: 'Hong Kong' }, hint: { zh: 'Line 1: 街道+大厦+室 | City: 地区 | State: — | ZIP: 留空或000', en: 'Line 1: Street+Building+Flat | City: District | ZIP: 000' } },
    { code: 'TW', phone: '+886', name: { zh: '台湾', en: 'Taiwan' }, hint: { zh: 'Line 1: 路段+巷弄+號 | City: 鄉鎮市區 | State: 縣市 | ZIP: 5碼', en: 'Line 1: Rd.+Lane+No. | City: Township | State: County/City | ZIP: 5-digit' } },
    { code: 'TH', phone: '+66', name: { zh: '泰国', en: 'Thailand' }, hint: { zh: 'Line 1: 门牌+街道 | City: 区 | State: 府 | ZIP: 5位数字', en: 'Line 1: House No.+Road | City: District | State: Province | ZIP: 5-digit' } },
    { code: 'VN', phone: '+84', name: { zh: '越南', en: 'Vietnam' }, hint: { zh: 'Line 1: 门牌+街道 | City: 郡/县 | State: 省/市 | ZIP: 6位数字', en: 'Line 1: House+Street | City: District | State: Province | ZIP: 6-digit' } },
    { code: 'MY', phone: '+60', name: { zh: '马来西亚', en: 'Malaysia' }, hint: { zh: 'Line 1: Jalan+编号 | City: 城市 | State: 州 | ZIP: 5位数字', en: 'Line 1: Jalan+Number | City | State | ZIP: 5-digit' } },
    { code: 'ID', phone: '+62', name: { zh: '印度尼西亚', en: 'Indonesia' }, hint: { zh: 'Line 1: Jalan+编号 | City: 城市 | State: 省 | ZIP: 5位数字', en: 'Line 1: Street+No. | City | State: Province | ZIP: 5-digit' } },
    { code: 'PH', phone: '+63', name: { zh: '菲律宾', en: 'Philippines' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城市 | State: 省 | ZIP: 4位数字', en: 'Line 1: Street+House | City | State: Province | ZIP: 4-digit' } },
    { code: 'IN', phone: '+91', name: { zh: '印度', en: 'India' }, hint: { zh: 'Line 1: 门牌+街道 | City: 城市 | State: 邦 | ZIP: 6位PIN', en: 'Line 1: House+Street | City | State: State | ZIP: 6-digit PIN' } },
    { code: 'AE', phone: '+971', name: { zh: '阿联酋', en: 'UAE' }, hint: { zh: 'Line 1: 街道+建筑物 | City: 城市 | State: 酋长国 | ZIP: 留空或000', en: 'Line 1: Street+Building | City | State: Emirate | ZIP: 000' } },
    { code: 'SA', phone: '+966', name: { zh: '沙特阿拉伯', en: 'Saudi Arabia' }, hint: { zh: 'Line 1: 街道+编号 | City: 城市 | State: 地区 | ZIP: 5位数字', en: 'Line 1: Street+No. | City | State: Region | ZIP: 5-digit' } },
    { code: 'RU', phone: '+7', name: { zh: '俄罗斯', en: 'Russia' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城市 | State: 州 | ZIP: 6位数字', en: 'Line 1: Street+House | City | State: Region | ZIP: 6-digit' } },
    { code: 'BR', phone: '+55', name: { zh: '巴西', en: 'Brazil' }, hint: { zh: 'Line 1: Rua+Número | City: Cidade | State: UF | ZIP: 8位数字', en: 'Line 1: Street+No. | City | State: UF | ZIP: 8-digit' } },
    { code: 'MX', phone: '+52', name: { zh: '墨西哥', en: 'Mexico' }, hint: { zh: 'Line 1: Calle+Número | City: Ciudad | State: Estado | ZIP: 5位数字', en: 'Line 1: Street+No. | City | State: State | ZIP: 5-digit' } },
    { code: 'NG', phone: '+234', name: { zh: '尼日利亚', en: 'Nigeria' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城市 | State: 州 | ZIP: 6位数字', en: 'Line 1: Street+Number | City | State | ZIP: 6-digit' } },
    { code: 'ZA', phone: '+27', name: { zh: '南非', en: 'South Africa' }, hint: { zh: 'Line 1: 街道+门牌 | City: 城市 | State: 省 | ZIP: 4位数字', en: 'Line 1: Street+Number | City | State: Province | ZIP: 4-digit' } },
    { code: 'OTHER', phone: '', name: { zh: '其他', en: 'Other' }, hint: { zh: '按本地习惯填写', en: 'Follow local format' } }
  ],

  t(key) {
    // 优先使用 Language 系统（拥有完整13语言翻译）
    if (typeof Language !== 'undefined' && Language.t) {
      const result = Language.t(key);
      if (result !== key) return result;
    }
    // 兜底到内部字典
    const entry = this.dict[key];
    if (!entry) return key;
    const lang = this.current;
    return entry[lang] || entry['en'] || entry['zh'] || key;
  },

  setLang(lang) {
    if (!this.validLangs.includes(lang)) return;
    this.current = lang;
    localStorage.setItem('language', lang);
    // 同步 Language 系统
    if (typeof Language !== 'undefined') {
      Language.changeLanguage(lang);
    }
    this._applyDOM();
    if (typeof CountrySelector !== 'undefined' && CountrySelector._onLangChange) {
      CountrySelector._onLangChange();
    }
    // 更新语言选择器
    this._updateLangSelects();
  },

  init() {
    // 读取统一的语言偏好（迁移旧键 i18n_lang → language）
    let saved = localStorage.getItem('language');
    if (!saved) {
      const oldKey = localStorage.getItem('i18n_lang');
      if (oldKey && this.validLangs.includes(oldKey)) {
        saved = oldKey;
        localStorage.setItem('language', oldKey);
        localStorage.removeItem('i18n_lang');
      }
    }
    if (saved && this.validLangs.includes(saved)) {
      this.current = saved;
    } else if (typeof Language !== 'undefined' && Language.currentLang) {
      this.current = Language.currentLang;
    }
    // 同步 Language 系统
    if (typeof Language !== 'undefined' && Language.currentLang !== this.current) {
      Language.changeLanguage(this.current);
    }
    this._applyDOM();
    this._updateLangSelects();
  },

  _applyDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-ph'));
    });
  },

  _updateLangSelects() {
    document.querySelectorAll('.lang-select, #langSelect').forEach(select => {
      select.value = this.current;
    });
  },

  getCountryList() {
    const cur = this.current;
    return this.countries.map(c => ({
      code: c.code,
      phone: c.phone,
      name: c.name[cur] || c.name['en'] || c.name['zh'],
      hint: c.hint[cur] || c.hint['en'] || c.hint['zh']
    }));
  }
};
