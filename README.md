# Qevora Studio 独立站优化版（多语言回归修复版）

这个版本已按原创手工包独立站方向整理，删除高风险侵权表达和第三方品牌商标表达，并修复了客户信息公开暴露、订单金额由前端决定、支付确认可伪造、多语言丢失等问题。

## 本版主要变化

- 网站定位改为 `Qevora Studio` 原创手工包。
- 保留 13 种语言：中文、English、한국어、日本語、Français、Español、العربية、Русский、Deutsch、Português、Italiano、ไทย、Tiếng Việt。
- 商品名称和商品描述也已补齐 13 种语言，不再只有中文/英文。
- 只公开 `/css`、`/js`、`/images`、`/pages` 和 `/data/products.json`，不再公开 `/server`、订单、会员、环境变量等私有文件。
- 支持游客结账：客户无需注册也可填写姓名、电话、收货地址并提交订单。
- 游客订单可通过本地订单访问 token 查看详情和支付信息，不会被强制跳转登录。
- 会员登录后仍可查看自己的订单列表。
- 后端会根据 `data/products.json` 重新计算商品价格，不再相信前端传来的订单金额。
- USDT 支付页会正确显示收款地址、网络和金额；提交 TxID 后只进入 `payment_submitted/待核验`，不会自动变成已支付。
- 邮箱 SMTP 未配置时不会长时间卡住；开发模式可返回验证码，生产模式会明确提示邮箱服务未配置。
- 清空测试会员、测试订单和测试购物车数据；删除 `.env` 和 `node_modules`。

## 启动方式

推荐在项目根目录运行：

```bash
npm install
npm start
```

也可以在 `server` 目录运行：

```bash
cd server
npm install
npm start
```

## 上线前必须做

1. 复制 `server/.env.example` 为 `server/.env`，填写真实配置。
2. 设置强随机 `JWT_SECRET`，不要用默认值。
3. 设置真实域名到 `ALLOWED_ORIGINS`。
4. 设置真实邮箱 SMTP，否则生产环境无法发送注册验证码。
5. 把 `ALLOW_DEV_CODES=false`，不要让验证码返回给前端。
6. 把 `SMS_MOCK=false`，除非只是在本地测试。
7. 把 `USDT_ADDRESS` 换成你的真实收款地址。
8. 上传真实原创商品图，替换 `placehold.co` 占位图。
9. 补齐隐私政策、退款政策、运输政策、服务条款。

## 创建后台管理员

在项目根目录执行：

```bash
ADMIN_EMAIL=你的邮箱 ADMIN_PASSWORD=至少10位强密码 npm run seed-admin
```

如果在 `server` 目录内执行，则使用：

```bash
ADMIN_EMAIL=你的邮箱 ADMIN_PASSWORD=至少10位强密码 npm run seed-admin
```

## 已做回归检查

- JS 语法检查通过。
- JSON 文件解析检查通过。
- 主要 HTML 页面可访问：首页、购物车、结账、登录、注册、订单、支付、后台、各系列页。
- 私有路径不可直接访问：`/server/data/orders.json`、`/server/data/members.json`、`/server/config.js`、`/server/.env`、`/data/users.json`。
- 游客下单流程通过。
- 后端金额重算通过：前端篡改金额为 `¥0` 时，后端仍按真实商品价格计算。
- 游客订单 token 权限校验通过。
- 支付信息接口权限校验通过。
- TxID 提交权限校验通过。
- 邮箱验证码开发模式快速返回通过。
- 13 种语言文件加载结构检查通过。

## 注意

不要销售带有第三方商标、Logo、专有图案、可混淆外观的商品。独立站、支付通道、主机、广告平台都可能因为侵权风险封停。建议只销售原创设计、合法授权产品或明确不侵权的手工设计。
