const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const ZH_PATH = path.join(config.projectRoot, 'js', 'i18n', 'zh.js');

// POST /api/admin/brand-names
// Body: { brands: { atelier: "新名称", totes: "新名称", ... } }
router.post('/brand-names', authMiddleware, adminMiddleware, (req, res) => {
  const { brands } = req.body;

  if (!brands || typeof brands !== 'object' || Object.keys(brands).length === 0) {
    return res.status(400).json({ success: false, message: '请提供品牌名称数据 { brands: { slug: "名称", ... } }' });
  }

  // Validate slugs
  const validSlugs = ['atelier', 'crossbody', 'woven', 'dior', 'fendi', 'hermes', 'bottega-veneta', 'balenciaga', 'evening', 'custom'];
  for (const slug of Object.keys(brands)) {
    if (!validSlugs.includes(slug)) {
      return res.status(400).json({ success: false, message: `无效的品牌标识: ${slug}` });
    }
    if (typeof brands[slug] !== 'string' || brands[slug].trim() === '') {
      return res.status(400).json({ success: false, message: `品牌 ${slug} 名称不能为空` });
    }
  }

  try {
    let content = fs.readFileSync(ZH_PATH, 'utf-8');

    for (const [slug, newName] of Object.entries(brands)) {
      // Escape special regex chars in newName (for safety in replacement string)
      const safeName = newName.trim();
      // Match: whitespace + "slug": + optional whitespace + "currentName" + comma/end
      // Pattern: captures the leading spaces, key quote and colon, then the value
      const regex = new RegExp(
        `(\\s*"${slug.replace(/-/g, '\\-')}"\\s*:\\s*)".*?"`,
        'g'
      );
      content = content.replace(regex, `$1"${safeName}"`);
    }

    fs.writeFileSync(ZH_PATH, content, 'utf-8');

    res.json({
      success: true,
      message: '品牌名称已更新',
      brands
    });
  } catch (err) {
    console.error('Failed to update brand names:', err.message);
    res.status(500).json({ success: false, message: '文件写入失败: ' + err.message });
  }
});

module.exports = router;
