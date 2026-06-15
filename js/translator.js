/**
 * Translator - 自动翻译工具
 * 使用 MyMemory 免费翻译 API 将中文自动翻译为其他语言
 * 免费额度：每天约5000字符（匿名），可注册邮箱提升
 */
const Translator = {
  // 语言代码映射（ISO 639-1）
  langMap: {
    zh: 'zh-CN',
    en: 'en',
    ko: 'ko',
    ja: 'ja',
    fr: 'fr',
    es: 'es',
    ar: 'ar',
    ru: 'ru',
    de: 'de',
    pt: 'pt',
    it: 'it',
    th: 'th',
    vi: 'vi'
  },

  // 不需要翻译的语言（内容与中文相同则跳过）
  sourceLang: 'zh',

  /**
   * 翻译单段文本
   * @param {string} text - 待翻译文本
   * @param {string} targetLang - 目标语言代码
   * @returns {Promise<string>} 翻译结果
   */
  async translateText(text, targetLang) {
    if (!text || !text.trim()) return '';
    // 如果目标语言就是中文，直接返回
    if (targetLang === this.sourceLang) return text;

    const srcCode = this.langMap[this.sourceLang] || 'zh-CN';
    const tgtCode = this.langMap[targetLang] || targetLang;

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcCode}|${tgtCode}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        let translated = data.responseData.translatedText;
        // MyMemory 有时返回全大写，尝试恢复大小写
        if (translated === translated.toUpperCase() && translated.length > 3 && targetLang !== 'zh') {
          translated = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
        }
        return translated;
      }
      return '';
    } catch (err) {
      console.warn(`Translation failed for ${targetLang}:`, err);
      return '';
    }
  },

  /**
   * 将文本批量翻译为所有语言
   * @param {string} text - 中文文本
   * @param {string[]} [targetLangs] - 目标语言列表，默认全部
   * @returns {Promise<Object>} { zh: '原文', en: '...', ko: '...', ... }
   */
  async translateAll(text, targetLangs) {
    const langs = targetLangs || Object.keys(this.langMap);
    const result = {};
    result[this.sourceLang] = text;

    if (!text || !text.trim()) return result;

    // 逐个翻译，避免触发频率限制
    for (const lang of langs) {
      if (lang === this.sourceLang) continue;
      result[lang] = await this.translateText(text, lang);
      // 小延迟避免 API 限频
      await new Promise(r => setTimeout(r, 300));
    }

    return result;
  },

  /**
   * 批量翻译多个键值对
   * @param {Object} entries - { key: chineseText }
   * @param {string[]} [targetLangs] - 目标语言列表
   * @returns {Promise<Object>} { key: { zh: '...', en: '...', ... }, ... }
   */
  async translateEntries(entries, targetLangs) {
    const result = {};
    for (const [key, text] of Object.entries(entries)) {
      if (!text || !text.trim()) {
        const langs = targetLangs || Object.keys(this.langMap);
        result[key] = {};
        langs.forEach(l => result[key][l] = '');
        continue;
      }
      result[key] = await this.translateAll(text, targetLangs);
    }
    return result;
  },

  /**
   * 显示翻译进度提示
   */
  showProgress(msg) {
    let el = document.getElementById('translatorProgress');
    if (!el) {
      el = document.createElement('div');
      el.id = 'translatorProgress';
      el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#1a1a1a;color:#d4af37;padding:10px 24px;font-size:13px;letter-spacing:1px;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
  },

  hideProgress() {
    const el = document.getElementById('translatorProgress');
    if (el) el.style.opacity = '0';
  }
};
