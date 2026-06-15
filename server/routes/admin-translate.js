const express = require('express');
const router = express.Router();
const https = require('https');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const config = require('../config');

// Language code mapping (ISO 639-1)
const LANG_MAP = {
  zh: 'zh-CN', en: 'en', ko: 'ko', ja: 'ja', fr: 'fr', es: 'es',
  ar: 'ar', ru: 'ru', de: 'de', pt: 'pt', it: 'it', th: 'th', vi: 'vi'
};

/**
 * Translate a single text via MyMemory API
 */
function translateText(text, sourceLang, targetLang) {
  return new Promise((resolve) => {
    const srcCode = LANG_MAP[sourceLang] || 'zh-CN';
    const tgtCode = LANG_MAP[targetLang] || targetLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcCode}|${tgtCode}`;

    https.get(url, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.responseStatus === 200 && json.responseData && json.responseData.translatedText) {
            let translated = json.responseData.translatedText;
            // Normalize all-caps results for non-Chinese languages
            if (translated === translated.toUpperCase() && translated.length > 3 && targetLang !== 'zh') {
              translated = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
            }
            resolve(translated);
          } else {
            resolve('');
          }
        } catch (e) {
          resolve('');
        }
      });
    }).on('error', () => resolve(''));
  });
}

// POST /api/admin/translate
// Body: { texts: [{ text: "中文", sourceLang: "zh", targetLangs: ["en","ko",...] }, ...] }
// Response: { success: true, translations: [{ zh: "...", en: "...", ko: "..." }, ...] }
router.post('/translate', authMiddleware, adminMiddleware, async (req, res) => {
  const { texts } = req.body;
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ success: false, message: '请提供待翻译文本数组' });
  }
  if (texts.length > 20) {
    return res.status(400).json({ success: false, message: '单次最多翻译 20 条文本' });
  }

  const results = [];
  for (const item of texts) {
    const { text, sourceLang = 'zh', targetLangs } = item;
    if (!text || !String(text).trim()) {
      results.push({});
      continue;
    }
    const langs = targetLangs || Object.keys(LANG_MAP).filter(l => l !== sourceLang);
    const translations = {};
    translations[sourceLang] = text;
    for (const lang of langs) {
      if (lang === sourceLang) continue;
      translations[lang] = await translateText(text, sourceLang, lang);
      // Small delay to avoid API rate limiting
      await new Promise(r => setTimeout(r, 250));
    }
    results.push(translations);
  }
  res.json({ success: true, translations: results });
});

// POST /api/admin/translate-brands
// Reads brand names from js/i18n/zh.js, translates to all 12 other languages,
// and writes translations into each js/i18n/{lang}.js file.
router.post('/translate-brands', authMiddleware, adminMiddleware, async (req, res) => {
  const I18N_DIR = path.join(config.projectRoot, 'js', 'i18n');
  const ZH_PATH = path.join(I18N_DIR, 'zh.js');
  const TARGET_LANGS = Object.keys(LANG_MAP).filter(l => l !== 'zh');

  // Read brand names from zh.js
  let zhContent;
  try {
    zhContent = fs.readFileSync(ZH_PATH, 'utf-8');
  } catch (err) {
    return res.status(500).json({ success: false, message: '读取 zh.js 失败: ' + err.message });
  }

  // Extract brand name entries from zh.js brands block
  const brandSlugs = ['atelier', 'totes', 'crossbody', 'woven', 'evening', 'custom',
                      'dior', 'hermes', 'balenciaga', 'bottega-veneta'];
  const brandNames = {};
  for (const slug of brandSlugs) {
    const regex = new RegExp(`"${slug}"\\s*:\\s*"([^"]*)"`, 'm');
    const match = zhContent.match(regex);
    if (match) {
      brandNames[slug] = match[1].trim();
    }
  }

  if (Object.keys(brandNames).length === 0) {
    return res.status(400).json({ success: false, message: '未在 zh.js 中找到品牌名称' });
  }

  // Translate each brand name to all target languages
  const translations = {}; // { en: { atelier: "...", totes: "..." }, ko: {...}, ... }
  for (const lang of TARGET_LANGS) {
    translations[lang] = {};
  }

  try {
    for (const [slug, zhName] of Object.entries(brandNames)) {
      for (const lang of TARGET_LANGS) {
        const translated = await translateText(zhName, 'zh', lang);
        translations[lang][slug] = translated || zhName; // fallback to zh if empty
        await new Promise(r => setTimeout(r, 200));
      }
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: '翻译过程出错: ' + err.message });
  }

  // Write translations to each target language file
  const results = { success: [], failed: [] };
  for (const lang of TARGET_LANGS) {
    const langPath = path.join(I18N_DIR, `${lang}.js`);
    if (!fs.existsSync(langPath)) {
      results.failed.push({ lang, reason: '文件不存在' });
      continue;
    }
    try {
      let content = fs.readFileSync(langPath, 'utf-8');
      for (const [slug, translatedText] of Object.entries(translations[lang])) {
        // Escape special regex chars in slug and translated text
        const escapedSlug = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const safeText = translatedText.replace(/"/g, '\\"');
        const regex = new RegExp(
          `("${escapedSlug}"\\s*:\\s*)".*?"`,
          'm'
        );
        content = content.replace(regex, `$1"${safeText}"`);
      }
      fs.writeFileSync(langPath, content, 'utf-8');
      results.success.push(lang);
    } catch (err) {
      results.failed.push({ lang, reason: err.message });
    }
  }

  res.json({
    success: true,
    message: `翻译完成: ${results.success.length} 种语言成功, ${results.failed.length} 失败`,
    results,
    translations
  });
});

module.exports = router;
