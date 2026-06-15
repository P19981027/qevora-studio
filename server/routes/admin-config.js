const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

// GET /api/admin/usdt-config
router.get('/usdt-config', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    success: true,
    usdt: {
      address: config.usdt.address,
      network: config.usdt.network,
      rate: config.usdt.rate
    }
  });
});

// POST /api/admin/usdt-config
router.post('/usdt-config', authMiddleware, adminMiddleware, (req, res) => {
  const { address, network, rate } = req.body;

  if (address === undefined || network === undefined || rate === undefined) {
    return res.status(400).json({ success: false, message: '缺少必要参数：address, network, rate' });
  }

  if (typeof address !== 'string' || address.trim() === '') {
    return res.status(400).json({ success: false, message: 'USDT 地址不能为空' });
  }

  const validNetworks = ['TRC20', 'ERC20', 'BEP20'];
  if (!validNetworks.includes(network)) {
    return res.status(400).json({ success: false, message: '无效的网络类型，支持：TRC20, ERC20, BEP20' });
  }

  const rateNum = parseFloat(rate);
  if (isNaN(rateNum) || rateNum <= 0) {
    return res.status(400).json({ success: false, message: '汇率必须为正数' });
  }

  // Update memory config
  config.usdt.address = address.trim();
  config.usdt.network = network;
  config.usdt.rate = rateNum;

  // Update .env file
  try {
    let envContent = '';
    if (fs.existsSync(ENV_PATH)) {
      envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    }

    const updateEnvVar = (content, key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      }
      return content.trimEnd() + '\n' + `${key}=${value}` + '\n';
    };

    envContent = updateEnvVar(envContent, 'USDT_ADDRESS', config.usdt.address);
    envContent = updateEnvVar(envContent, 'USDT_NETWORK', config.usdt.network);
    envContent = updateEnvVar(envContent, 'USDT_RATE', config.usdt.rate);

    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
  } catch (err) {
    console.error('Failed to update .env:', err.message);
    return res.status(500).json({ success: false, message: '配置文件写入失败' });
  }

  res.json({
    success: true,
    message: 'USDT 配置已更新',
    usdt: {
      address: config.usdt.address,
      network: config.usdt.network,
      rate: config.usdt.rate
    }
  });
});

module.exports = router;
