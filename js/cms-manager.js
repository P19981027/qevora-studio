const CMSManager = {
    STORAGE_KEY: 'data/cms-content',

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    save(data) {
        data.updatedAt = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data, null, 2));
    },

    init() {
        let data = this.load();
        if (!data) {
            data = this.buildDefaultsFromi18n();
            this.save(data);
        } else if (!data.version || data.version < 7) {
            // Migration: rebuild brand data from BrandsConfig to include new brands
            const allBrands = typeof BrandsConfig !== 'undefined' ? BrandsConfig.getAllBrands() : [];
            const langs = Object.keys(Language.nativeNames || {});
            allBrands.forEach(b => {
                const slug = b.slug;
                if (!data.brands) data.brands = {};
                if (!data.brands[slug]) {
                    data.brands[slug] = {
                        englishName: b.englishName || slug.toUpperCase(),
                        name: {},
                        homeBgImage: '',
                        heroTitle: {},
                        heroPrice: {},
                        heroDesc: {},
                        introTitle: {},
                        introP1: {},
                        introP2: {}
                    };
                }
                // Fill missing name translations from i18n
                langs.forEach(lang => {
                    if (!data.brands[slug]) data.brands[slug] = {};
                    if (!data.brands[slug].name) data.brands[slug].name = {};
                    const trans = window.i18nTranslations && window.i18nTranslations[lang];
                    const val = trans && trans.brands && trans.brands[slug] ? trans.brands[slug] : (b.name || slug);
                    data.brands[slug].name[lang] = val;
                });
                // Clear hero/intro fields to let Language.t() handle them
                data.brands[slug].heroTitle = {};
                data.brands[slug].heroPrice = {};
                data.brands[slug].heroDesc = {};
                data.brands[slug].introTitle = {};
                data.brands[slug].introP1 = {};
                data.brands[slug].introP2 = {};
            });
            data.version = 7;
            this.save(data);
        }
        this.applyToBrandsConfig();
    },

    buildDefaultsFromi18n() {
        const langs = Object.keys(Language.nativeNames || {
            zh: '', en: '', ko: '', ja: '', fr: '', es: '', ar: '', ru: '', de: '', pt: '', it: '', th: '', vi: ''
        });
        const data = { version: 7, overrides: {}, settings: {}, brands: {}, qualityFeatures: [] };

        // Build brand data from ALL brands in BrandsConfig
        const allBrands = typeof BrandsConfig !== 'undefined' ? BrandsConfig.getAllBrands() : [];
        allBrands.forEach(b => {
            const slug = b.slug;
            const brandData = {
                englishName: b.englishName || slug.toUpperCase(),
                name: {},
                homeBgImage: '',
                heroTitle: {},
                heroPrice: {},
                heroDesc: {},
                introTitle: {},
                introP1: {},
                introP2: {}
            };

            langs.forEach(lang => {
                const trans = window.i18nTranslations && window.i18nTranslations[lang];
                if (trans) {
                    brandData.name[lang] = trans.brands && trans.brands[slug] ? trans.brands[slug] : (b.name || slug);
                }
                // heroTitle, heroPrice, heroDesc, introP1, introP2 intentionally
                // left empty - frontend uses Language.t() with {englishName} substitution
            });

            data.brands[slug] = brandData;
        });

        // Build quality features from i18n
        const zhTrans = window.i18nTranslations && window.i18nTranslations.zh;
        const featureCount = (zhTrans && zhTrans.quality && zhTrans.quality.features) ? zhTrans.quality.features.length : 4;
        for (let i = 0; i < featureCount; i++) {
            const feature = { icon: '', title: {}, desc: {} };
            langs.forEach(lang => {
                const trans = window.i18nTranslations && window.i18nTranslations[lang];
                if (trans && trans.quality && trans.quality.features && trans.quality.features[i]) {
                    feature.icon = trans.quality.features[i].icon || feature.icon;
                    feature.title[lang] = trans.quality.features[i].title || '';
                    feature.desc[lang] = trans.quality.features[i].desc || '';
                }
            });
            data.qualityFeatures.push(feature);
        }

        // Initialize empty overrides for all languages
        langs.forEach(lang => { data.overrides[lang] = {}; });

        // Default settings
        data.settings = { heroBgColor: '', heroBgImage: '', primaryColor: '', logoText: '', customCSS: '' };

        return data;
    },

    // --- Overrides ---
    getOverride(lang, key) {
        const data = this.load();
        if (!data || !data.overrides || !data.overrides[lang]) return null;
        const val = data.overrides[lang][key];
        return (val !== undefined && val !== '') ? val : null;
    },

    setOverride(lang, key, value) {
        const data = this.load();
        if (!data.overrides) data.overrides = {};
        if (!data.overrides[lang]) data.overrides[lang] = {};
        if (value && value.trim && value.trim() !== '') {
            data.overrides[lang][key] = value.trim();
        } else {
            delete data.overrides[lang][key];
        }
        this.save(data);
    },

    // --- Settings ---
    getSetting(key) {
        const data = this.load();
        return (data && data.settings && data.settings[key]) || null;
    },

    setSetting(key, value) {
        const data = this.load();
        if (!data.settings) data.settings = {};
        data.settings[key] = value || '';
        this.save(data);
    },

    getAllSettings() {
        const data = this.load();
        return (data && data.settings) || {};
    },

    // --- Brands ---
    getBrandData(slug) {
        const data = this.load();
        return (data && data.brands && data.brands[slug]) || null;
    },

    setBrandData(slug, brandData) {
        const data = this.load();
        if (!data.brands) data.brands = {};
        data.brands[slug] = brandData;
        this.save(data);
        this.applyToBrandsConfig();
    },

    getAllBrandsData() {
        const data = this.load();
        return (data && data.brands) || {};
    },

    applyToBrandsConfig() {
        const data = this.load();
        if (!data || !data.brands) return;
        const lang = (typeof Language !== 'undefined') ? Language.currentLang : 'zh';

        BrandsConfig.brands.forEach(brand => {
            const cmsBrand = data.brands[brand.slug];
            if (cmsBrand) {
                if (cmsBrand.englishName) brand.englishName = cmsBrand.englishName;
                if (cmsBrand.name && cmsBrand.name[lang]) brand.name = cmsBrand.name[lang];
                if (cmsBrand.introP1 && cmsBrand.introP1[lang]) brand.description = cmsBrand.introP1[lang];
            }
        });
    },

    // --- Quality Features ---
    getQualityFeatures() {
        const data = this.load();
        return (data && data.qualityFeatures) || null;
    },

    setQualityFeatures(features) {
        const data = this.load();
        if (!data) return;
        data.qualityFeatures = features;
        this.save(data);
    },

    // --- Apply settings to DOM ---
    applySettings() {
        const settings = this.getAllSettings();

        if (settings.heroBgImage) {
            const heroEl = document.querySelector('.home-hero') || document.querySelector('.brand-hero');
            if (heroEl) heroEl.style.background = `url('${settings.heroBgImage}') center/cover no-repeat`;
        } else if (settings.heroBgColor) {
            const heroEl = document.querySelector('.home-hero') || document.querySelector('.brand-hero');
            if (heroEl) heroEl.style.background = settings.heroBgColor;
        }

        if (settings.primaryColor) {
            document.documentElement.style.setProperty('--gold', settings.primaryColor);
            document.documentElement.style.setProperty('--accent-color', settings.primaryColor);
        }

        if (settings.logoText) {
            document.querySelectorAll('.nav-logo, .admin-nav-logo, .footer-logo').forEach(el => {
                el.textContent = settings.logoText;
            });
        }

        if (settings.customCSS) {
            let styleEl = document.getElementById('cms-custom-css');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'cms-custom-css';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = settings.customCSS;
        }
    },

    // --- Get brand field for current language with fallback ---
    getBrandField(slug, field, lang) {
        const brandData = this.getBrandData(slug);
        if (!brandData || !brandData[field]) return null;
        return brandData[field][lang] || brandData[field].zh || brandData[field].en || null;
    },

    // --- Export / Import ---
    exportCMS() {
        const data = this.load();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cms-content.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    importCMS(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.version) {
                this.save(data);
                this.applyToBrandsConfig();
                return { success: true };
            }
            return { success: false, message: 'Invalid format' };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    // --- Settings ---
    getSettings() {
        const data = this.load();
        return data ? (data.settings || {}) : {};
    },

    setSettings(settings) {
        const data = this.load();
        if (!data) return;
        data.settings = settings;
        this.save(data);
    },

    resetCMS() {
        const data = this.buildDefaultsFromi18n();
        this.save(data);
        this.applyToBrandsConfig();
    }
};

// Auto-initialize before Language.init() runs
document.addEventListener('DOMContentLoaded', () => {
    CMSManager.init();
}, true); // useCapture=true to ensure it runs first
