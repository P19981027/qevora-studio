const express = require('express');
const path = require('path');
const config = require('./config');

const app = express();

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  const localhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (config.allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && localhost)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/email', require('./routes/email'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/address', require('./routes/address'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/admin-config'));
app.use('/api/admin', require('./routes/admin-translate'));
app.use('/api/admin', require('./routes/admin-brand-names'));

// Static files: whitelist public assets only. Do not expose /server or private data files.
const root = config.projectRoot;
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js'), {
  setHeaders: (res, filePath) => {
    if (filePath.includes(path.sep + 'i18n' + path.sep)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use('/images', express.static(path.join(root, 'images')));
app.use('/pages', express.static(path.join(root, 'pages')));
app.get('/data/products.json', (req, res) => res.sendFile(path.join(root, 'data', 'products.json')));

const htmlPages = ['index.html', 'cart.html', 'checkout.html', 'login.html', 'register.html', 'orders.html', 'payment.html', 'admin.html'];
htmlPages.forEach(file => { app.get('/' + file, (req, res) => res.sendFile(path.join(root, file))); });
app.get('/', (req, res) => res.sendFile(path.join(root, 'index.html')));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: '接口不存在' });
  return res.status(404).sendFile(path.join(root, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Qevora Studio server running on http://localhost:${config.port}`);
  console.log(`SMS mock mode: ${config.smsMock}`);
});
