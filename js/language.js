// 多语言系统 - 支持13种语言
const Language = {
    currentLang: 'zh',
    rtlLanguages: ['ar'],
    nativeNames: {
        zh: '中文',
        en: 'English',
        ko: '한국어',
        ja: '日本語',
        fr: 'Français',
        es: 'Español',
        ar: 'العربية',
        ru: 'Русский',
        de: 'Deutsch',
        pt: 'Português',
        it: 'Italiano',
        th: 'ไทย',
        vi: 'Tiếng Việt'
    },

    get translations() {
        return window.i18nTranslations || {};
    },

    init() {
        let savedLang = localStorage.getItem('language');
        // Migrate old i18n_lang key
        if (!savedLang) {
            const oldKey = localStorage.getItem('i18n_lang');
            if (oldKey && this.nativeNames[oldKey]) {
                savedLang = oldKey;
                localStorage.setItem('language', oldKey);
                localStorage.removeItem('i18n_lang');
            }
        }
        if (savedLang && this.nativeNames[savedLang]) {
            this.currentLang = savedLang;
        } else {
            const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
            const langMap = { zh: 'zh', en: 'en', ko: 'ko', ja: 'ja', fr: 'fr', es: 'es', ar: 'ar', ru: 'ru', de: 'de', pt: 'pt', it: 'it', th: 'th', vi: 'vi' };
            const prefix = browserLang.split('-')[0];
            this.currentLang = langMap[prefix] || 'zh';
        }
        this.applyLanguage();
    },

    changeLanguage(lang) {
        if (!this.nativeNames[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage();
        if (typeof BrandPage !== 'undefined' && BrandPage.renderProducts) {
            BrandPage.renderProducts();
        }
        if (typeof AdminApp !== 'undefined' && AdminApp.renderTable) {
            AdminApp.renderTable();
        }
    },

    t(key, params) {
        // Step 1: Check CMS override
        if (typeof CMSManager !== 'undefined') {
            const override = CMSManager.getOverride(this.currentLang, key);
            if (override !== null) {
                if (params) {
                    return override.replace(/\{(\w+)\}/g, (match, p) => params[p] !== undefined ? params[p] : match);
                }
                return override;
            }
        }

        // Step 2: Handle quality.features.N.* from CMS
        const qMatch = key.match(/^quality\.features\.(\d+)\.(icon|title|desc)$/);
        if (qMatch && typeof CMSManager !== 'undefined') {
            const features = CMSManager.getQualityFeatures();
            if (features) {
                const idx = parseInt(qMatch[1]);
                const prop = qMatch[2];
                if (features[idx] && features[idx][prop] && features[idx][prop][this.currentLang]) {
                    return features[idx][prop][this.currentLang];
                }
            }
        }

        // Step 3: Original i18n lookup
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }
        if (typeof value === 'string') {
            if (params) {
                return value.replace(/\{(\w+)\}/g, (match, p) => params[p] !== undefined ? params[p] : match);
            }
            return value;
        }
        return key;
    },

    applyLanguage() {
        const isRTL = this.rtlLanguages.includes(this.currentLang);
        document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', this.currentLang);

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation !== key) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'SELECT') {
                    // 不覆盖 select 的选项
                } else {
                    element.textContent = translation;
                }
            }
        });

        // 支持 data-i18n-ph 属性（显式设置 placeholder）
        document.querySelectorAll('[data-i18n-ph]').forEach(element => {
            const key = element.getAttribute('data-i18n-ph');
            const translation = this.t(key);
            if (translation !== key) {
                element.placeholder = translation;
            }
        });

        this.updateDynamicContent();
        this.updateTitle();
        this.updateLangSelects();

        // Apply CMS settings after language change
        if (typeof CMSManager !== 'undefined') {
            CMSManager.applyToBrandsConfig();
            CMSManager.applySettings();
        }
    },

    updateDynamicContent() {
        // 更新品質特性卡片 - 使用 Language.t() 以支持CMS覆盖
        const qualityCards = document.querySelectorAll('.quality-card');
        qualityCards.forEach((card, i) => {
            const iconEl = card.querySelector('.quality-icon');
            const titleEl = card.querySelector('h3');
            const descEl = card.querySelector('p');
            if (iconEl) iconEl.textContent = this.t(`quality.features.${i}.icon`);
            if (titleEl) titleEl.textContent = this.t(`quality.features.${i}.title`);
            if (descEl) descEl.textContent = this.t(`quality.features.${i}.desc`);
        });

        // 更新品牌卡片名称（动态读取所有品牌）
        const allBrands = typeof BrandsConfig !== 'undefined' ? BrandsConfig.getAllBrands() : [];
        allBrands.forEach(brand => {
            const slug = brand.slug;
            const brandNameEl = document.querySelector(`.brand-card.${slug} .brand-name`);
            const brandSubEl = document.querySelector(`.brand-card.${slug} .brand-subtitle`);
            const translation = this.t(`brands.${slug}`);
            if (brandNameEl && translation !== `brands.${slug}`) {
                brandNameEl.textContent = translation;
            }
            if (brandSubEl) {
                brandSubEl.textContent = brand.englishName || '';
            }
        });
    },

    updateTitle() {
        const path = window.location.pathname;
        if (path.includes('/admin')) {
            document.title = this.t('pageTitle.admin');
        } else if (path.includes('/pages/')) {
            const slug = path.split('/pages/')[1]?.split('/')[0];
            if (slug) {
                const brandName = this.t(`brands.${slug}`);
                document.title = this.t('pageTitle.brand', { brandName });
            }
        } else {
            document.title = this.t('pageTitle.home');
        }
    },

    updateLangSelects() {
        document.querySelectorAll('#langSelect, .lang-select').forEach(select => {
            select.value = this.currentLang;
        });
    },

    getCategoryName(category) {
        const map = {
            all: 'products.all',
            classic: 'products.classic',
            handbags: 'products.handbags',
            accessories: 'products.accessories',
            limited: 'products.limited'
        };
        return this.t(map[category] || category);
    },

    getLanguageOptionsHTML() {
        return Object.entries(this.nativeNames)
            .map(([code, name]) => `<option value="${code}"${code === this.currentLang ? ' selected' : ''}>${name}</option>`)
            .join('');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Language.init();
});
