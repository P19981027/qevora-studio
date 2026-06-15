const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const config = require('../config');

router.get('/', (req, res) => {
  try {
    const filePath = path.join(config.projectRoot, 'data', 'products.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ success: true, data });
  } catch {
    res.json({ success: true, data: {} });
  }
});

router.get('/:brandSlug', (req, res) => {
  try {
    const filePath = path.join(config.projectRoot, 'data', 'products.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const brand = data[req.params.brandSlug];
    if (!brand) return res.status(404).json({ success: false, message: '品牌不存在' });
    res.json({ success: true, data: brand });
  } catch {
    res.status(404).json({ success: false, message: '品牌不存在' });
  }
});

module.exports = router;
