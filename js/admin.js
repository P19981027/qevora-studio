const AdminApp = {
    data: {
        products: [],
        filteredProducts: [],
        currentPage: 1,
        pageSize: 12,
        totalItems: 0,
        editingProductId: null,
        editingBrandSlug: null,
        activeSection: 'products',
        editingLang: 'zh',
        // Multilingual product fields being edited
        productNames: {},
        productDescriptions: {}
    },

    get brands() { return BrandsConfig.brands; },

    async init() {
        await this.loadData();
        this.populateSelects();
        this.populateLangSelects();
        this.setupEventListeners();
        this.renderTable();
        this.renderStats();
        this.applyLanguage();
    },

    // --- Language dropdowns for CMS sections ---
    populateLangSelects() {
        const html = Language.getLanguageOptionsHTML();
        ['homepageLangSelect', 'brandLangSelect', 'contactLangSelect', 'footerLangSelect'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        });

        // Brand slug select
        const brandSlugSelect = document.getElementById('brandSlugSelect');
        if (brandSlugSelect) {
            brandSlugSelect.innerHTML = this.brands.map(b =>
                `<option value="${b.slug}">${b.englishName}</option>`
            ).join('');
        }
    },

    // --- Sidebar Navigation ---
    switchSection(sectionId) {
        this.data.activeSection = sectionId;
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeItem) activeItem.classList.add('active');
        document.querySelectorAll('.cms-section').forEach(s => s.style.display = 'none');
        const section = document.getElementById(`section-${sectionId}`);
        if (section) section.style.display = 'block';
        this.loadSectionData(sectionId);
    },

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'products': this.renderTable(); this.renderStats(); break;
            case 'homepage': this.loadHomepageEditor(); break;
            case 'brands': this.loadBrandsEditor(); break;
            case 'brandnames': this.loadBrandNamesEditor(); break;
            case 'contact': this.loadContactEditor(); break;
            case 'footer': this.loadFooterEditor(); break;
            case 'members': this.loadMembersEditor(); break;
            case 'orders': this.loadOrdersEditor(); break;
            case 'settings': this.loadSettingsEditor(); break;
        }
    },

    // --- Homepage Editor ---
    loadHomepageEditor() {
        const lang = document.getElementById('homepageLangSelect')?.value || 'zh';
        this.data.editingLang = lang;
        const fields = ['hero.subtitle', 'hero.title', 'hero.description', 'hero.explore',
                        'brands.title', 'brands.subtitle', 'quality.title', 'quality.subtitle'];
        fields.forEach(key => {
            const input = document.querySelector(`#section-homepage [data-cms-key="${key}"]`);
            if (input) {
                const override = CMSManager.getOverride(lang, key);
                input.value = override || '';
                input.placeholder = Language.t(key);
            }
        });
        this.loadQualityFeaturesEditor();
    },

    loadQualityFeaturesEditor() {
        const container = document.getElementById('qualityFeaturesEditor');
        if (!container) return;
        const features = CMSManager.getQualityFeatures() || [];
        const lang = this.data.editingLang;
        container.innerHTML = features.map((f, i) => `
            <div class="feature-editor-card" data-feature-index="${i}">
                <div class="feature-card-header">
                    <span>ç¹æ§ ${i + 1}</span>
                    <button class="btn btn-sm btn-delete" onclick="AdminApp.removeFeature(${i})">å é¤</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>å¾æ </label>
                        <input type="text" class="feature-icon-input" value="${f.icon || ''}" style="max-width:80px">
                    </div>
                    <div class="form-group">
                        <label>æ é¢</label>
                        <input type="text" class="feature-title-input" value="${f.title?.[lang] || ''}" placeholder="${f.title?.zh || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>æè¿°</label>
                    <textarea class="feature-desc-input" rows="2">${f.desc?.[lang] || ''}</textarea>
                </div>
            </div>
        `).join('');
    },

    addFeature() {
        const features = CMSManager.getQualityFeatures() || [];
        const lang = this.data.editingLang;
        const newFeature = { icon: 'â¨', title: {}, desc: {} };
        Object.keys(Language.nativeNames).forEach(l => {
            newFeature.title[l] = '';
            newFeature.desc[l] = '';
        });
        features.push(newFeature);
        CMSManager.setQualityFeatures(features);
        this.loadQualityFeaturesEditor();
    },

    removeFeature(index) {
        const features = CMSManager.getQualityFeatures() || [];
        features.splice(index, 1);
        CMSManager.setQualityFeatures(features);
        this.loadQualityFeaturesEditor();
    },

    saveHomepage() {
        const lang = this.data.editingLang;
        const fields = ['hero.subtitle', 'hero.title', 'hero.description', 'hero.explore',
                        'brands.title', 'brands.subtitle', 'quality.title', 'quality.subtitle'];
        fields.forEach(key => {
            const input = document.querySelector(`#section-homepage [data-cms-key="${key}"]`);
            if (input) CMSManager.setOverride(lang, key, input.value);
        });
        this.saveQualityFeatures();
        this.showNotification(Language.t('admin.notificationUpdated'), 'success');
    },

    saveQualityFeatures() {
        const lang = this.data.editingLang;
        const cards = document.querySelectorAll('.feature-editor-card');
        const features = CMSManager.getQualityFeatures() || [];
        cards.forEach((card, i) => {
            if (!features[i]) features[i] = { icon: '', title: {}, desc: {} };
            if (!features[i].title) features[i].title = {};
            if (!features[i].desc) features[i].desc = {};
            features[i].icon = card.querySelector('.feature-icon-input')?.value || '';
            features[i].title[lang] = card.querySelector('.feature-title-input')?.value || '';
            features[i].desc[lang] = card.querySelector('.feature-desc-input')?.value || '';
        });
        CMSManager.setQualityFeatures(features);
    },

    resetHomepage() {
        if (!confirm('ç¡®å®è¦éç½®é¦é¡µåå®¹ä¸ºé»è®¤å¼åï¼')) return;
        const lang = this.data.editingLang;
        const fields = ['hero.subtitle', 'hero.title', 'hero.description', 'hero.explore',
                        'brands.title', 'brands.subtitle', 'quality.title', 'quality.subtitle'];
        fields.forEach(key => CMSManager.setOverride(lang, key, ''));
        this.loadHomepageEditor();
        this.showNotification('å·²éç½®', 'success');
    },

    // --- Brand Editor ---
    loadBrandsEditor() {
        const slug = document.getElementById('brandSlugSelect')?.value || 'atelier';
        const lang = document.getElementById('brandLangSelect')?.value || 'zh';
        this.data.editingLang = lang;
        const brandData = CMSManager.getBrandData(slug) || {};

        const nameInput = document.getElementById('brandNameInput');
        const englishNameInput = document.getElementById('brandEnglishNameInput');
        const heroTitleInput = document.getElementById('brandHeroTitleInput');
        const heroPriceInput = document.getElementById('brandHeroPriceInput');
        const heroDescInput = document.getElementById('brandHeroDescInput');
        const introTitleInput = document.getElementById('brandIntroTitleInput');
        const introP1Input = document.getElementById('brandIntroP1Input');
        const introP2Input = document.getElementById('brandIntroP2Input');

        // Load brand background image
        const bgUrlInput = document.getElementById('brandBgImageUrl');
        if (bgUrlInput) {
            bgUrlInput.value = brandData.homeBgImage || '';
        }
        this.updateBrandBgPreview(brandData.homeBgImage || '');

        if (nameInput) {
            nameInput.value = brandData.name?.[lang] || '';
            nameInput.placeholder = Language.t(`brands.${slug}`);
        }
        if (englishNameInput) {
            englishNameInput.value = brandData.englishName || '';
            // When englishName changes, update placeholders on related fields
            englishNameInput.oninput = () => {
                const en = englishNameInput.value || '';
                if (heroTitleInput && !heroTitleInput.value) heroTitleInput.placeholder = Language.t('brand.heroTitle', { englishName: en });
                if (introTitleInput && !introTitleInput.value) introTitleInput.placeholder = Language.t('brand.introTitle', { englishName: en });
                if (introP1Input && !introP1Input.value) introP1Input.placeholder = Language.t('brand.introP1', { englishName: en });
            };
        }
        if (heroTitleInput) {
            heroTitleInput.value = brandData.heroTitle?.[lang] || '';
            heroTitleInput.placeholder = Language.t('brand.heroTitle', { englishName: brandData.englishName || '' });
        }
        if (heroPriceInput) {
            heroPriceInput.value = brandData.heroPrice?.[lang] || '';
            heroPriceInput.placeholder = Language.t('brand.heroPrice');
        }
        if (heroDescInput) {
            heroDescInput.value = brandData.heroDesc?.[lang] || '';
            heroDescInput.placeholder = Language.t('brand.heroDesc');
        }
        if (introTitleInput) {
            introTitleInput.value = brandData.introTitle?.[lang] || '';
            introTitleInput.placeholder = Language.t('brand.introTitle', { englishName: brandData.englishName || '' });
        }
        if (introP1Input) {
            introP1Input.value = brandData.introP1?.[lang] || '';
            introP1Input.placeholder = Language.t('brand.introP1', { englishName: brandData.englishName || '' });
        }
        if (introP2Input) {
            introP2Input.value = brandData.introP2?.[lang] || '';
            introP2Input.placeholder = Language.t('brand.introP2');
        }
    },

    saveBrands() {
        const slug = document.getElementById('brandSlugSelect')?.value || 'atelier';
        const lang = document.getElementById('brandLangSelect')?.value || 'zh';
        const brandData = CMSManager.getBrandData(slug) || { name: {}, englishName: '', homeBgImage: '', heroTitle: {}, heroPrice: {}, heroDesc: {}, introTitle: {}, introP1: {}, introP2: {} };

        if (!brandData.name) brandData.name = {};
        if (!brandData.heroTitle) brandData.heroTitle = {};
        if (!brandData.heroPrice) brandData.heroPrice = {};
        if (!brandData.heroDesc) brandData.heroDesc = {};
        if (!brandData.introTitle) brandData.introTitle = {};
        if (!brandData.introP1) brandData.introP1 = {};
        if (!brandData.introP2) brandData.introP2 = {};

        brandData.name[lang] = document.getElementById('brandNameInput')?.value || '';
        brandData.englishName = document.getElementById('brandEnglishNameInput')?.value || brandData.englishName;
        brandData.homeBgImage = document.getElementById('brandBgImageUrl')?.value || '';
        brandData.heroTitle[lang] = document.getElementById('brandHeroTitleInput')?.value || '';
        brandData.heroPrice[lang] = document.getElementById('brandHeroPriceInput')?.value || '';
        brandData.heroDesc[lang] = document.getElementById('brandHeroDescInput')?.value || '';
        brandData.introTitle[lang] = document.getElementById('brandIntroTitleInput')?.value || '';
        brandData.introP1[lang] = document.getElementById('brandIntroP1Input')?.value || '';
        brandData.introP2[lang] = document.getElementById('brandIntroP2Input')?.value || '';

        CMSManager.setBrandData(slug, brandData);
        this.showNotification(Language.t('admin.notificationUpdated'), 'success');
    },

    resetBrands() {
        if (!confirm('ç¡®å®è¦éç½®æ­¤åçä¿¡æ¯ä¸ºé»è®¤å¼åï¼')) return;
        CMSManager.resetCMS();
        this.loadBrandsEditor();
        this.showNotification('å·²éç½®', 'success');
    },

    // --- Brand Names Editor ---
    loadBrandNamesEditor() {
        const container = document.getElementById('brandNamesEditor');
        if (!container) return;
        container.innerHTML = this.brands.map(b => `
            <div class="form-group">
                <label>${b.englishName}</label>
                <input type="text" class="cms-input brand-name-input" data-slug="${b.slug}" value="${this.escapeHtml(b.name)}">
            </div>
        `).join('');
    },

    escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    async saveBrandNames() {
        const inputs = document.querySelectorAll('.brand-name-input');
        const brands = {};
        inputs.forEach(inp => {
            const slug = inp.getAttribute('data-slug');
            const name = inp.value.trim();
            if (slug && name) brands[slug] = name;
        });

        if (Object.keys(brands).length === 0) {
            this.showNotification('è¯·å¡«ååçåç§°', 'error');
            return;
        }

        try {
            const res = await API.post('/admin/brand-names', { brands }, true);
            if (res.success) {
                // Update in-memory BrandsConfig so UI reflects immediately
                Object.entries(brands).forEach(([slug, name]) => {
                    const brand = BrandsConfig.getBrandBySlug(slug);
                    if (brand) brand.name = name;
                });
                this.showNotification('åçåç§°å·²ä¿å­ï¼é¦é¡µå·²çæ', 'success');
            } else {
                this.showNotification(res.message || 'ä¿å­å¤±è´¥', 'error');
            }
        } catch (e) {
            this.showNotification('ç½ç»éè¯¯ï¼ä¿å­å¤±è´¥', 'error');
        }
    },

    /** Translate all 10 brand names from Chinese to all 12 other languages,
     *  then write results to js/i18n/*.js files via backend API. */
    async translateBrandNames() {
        if (!confirm('å°æ10ä¸ªåççä¸­æåç§°ç¿»è¯ä¸ºå¶ä»12ç§è¯­è¨å¹¶åå¥i18næä»¶ã\n\nè¯·ç¡®ä¿å·²åä¿å­åçä¸­æåç§°ã\n\nç¡®è®¤ç»§ç»­ï¼')) return;

        Translator.showProgress('æ­£å¨ç¿»è¯åçåç§°ï¼çº¦é30ç§ï¼...');
        try {
            const res = await API.post('/admin/translate-brands', {}, true);
            Translator.hideProgress();
            if (res.success) {
                // Refresh brand names editor to show latest from i18n
                this.showNotification(res.message || 'ç¿»è¯å®æ', 'success');
                // Reload the page to pick up new i18n files
                setTimeout(() => {
                    if (confirm('ç¿»è¯å·²å®æï¼å·æ°é¡µé¢ä»¥å è½½æ°çåçåç§°ï¼')) {
                        location.reload();
                    }
                }, 500);
            } else {
                this.showNotification(res.message || 'ç¿»è¯å¤±è´¥', 'error');
            }
        } catch (e) {
            Translator.hideProgress();
            this.showNotification('ç¿»è¯å¤±è´¥: ç½ç»éè¯¯', 'error');
        }
    },

    // --- Brand Background Image ---
    async handleBrandBgFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const preview = document.getElementById('brandBgPreview');
        if (preview) preview.style.opacity = '0.5';
        try {
            const formData = new FormData();
            formData.append('image', file);
            const token = localStorage.getItem('auth_token') || '';
            const resp = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || 'ä¸ä¼ å¤±è´¥');
            }
            const result = await resp.json();
            const imageUrl = window.location.origin + result.url;
            document.getElementById('brandBgImageUrl').value = imageUrl;
            this.updateBrandBgPreview(imageUrl);
            if (preview) preview.style.opacity = '1';
        } catch (err) {
            alert('å¾çä¸ä¼ å¤±è´¥: ' + err.message);
            if (preview) preview.style.opacity = '1';
            const fileInput = document.getElementById('brandBgImageFile');
            if (fileInput) fileInput.value = '';
        }
    },

    loadBrandBgFromUrl() {
        const url = document.getElementById('brandBgImageUrl').value.trim();
        if (!url) return;
        this.updateBrandBgPreview(url);
    },

    clearBrandBgImage() {
        document.getElementById('brandBgImageUrl').value = '';
        this.updateBrandBgPreview('');
    },

    updateBrandBgPreview(src) {
        const preview = document.getElementById('brandBgPreview');
        const hint = document.getElementById('brandBgUploadHint');
        if (preview && hint) {
            if (src) {
                preview.src = src;
                preview.style.display = 'block';
                hint.style.display = 'none';
            } else {
                preview.src = '';
                preview.style.display = 'none';
                hint.style.display = 'flex';
            }
        }
    },

    // --- Contact Editor ---
    loadContactEditor() {
        const lang = document.getElementById('contactLangSelect')?.value || 'zh';
        this.data.editingLang = lang;
        const fields = ['contact.xValue', 'contact.wechatValue', 'contact.insValue'];
        fields.forEach(key => {
            const input = document.querySelector(`#section-contact [data-cms-key="${key}"]`);
            if (input) {
                const override = CMSManager.getOverride(lang, key);
                input.value = override || '';
                input.placeholder = Language.t(key);
            }
        });
    },

    saveContact() {
        const lang = this.data.editingLang;
        const fields = ['contact.xValue', 'contact.wechatValue', 'contact.insValue'];
        fields.forEach(key => {
            const input = document.querySelector(`#section-contact [data-cms-key="${key}"]`);
            if (input) CMSManager.setOverride(lang, key, input.value);
        });
        this.showNotification(Language.t('admin.notificationUpdated'), 'success');
    },

    resetContact() {
        if (!confirm('ç¡®å®è¦éç½®èç³»æ¹å¼ä¸ºé»è®¤å¼åï¼')) return;
        const lang = this.data.editingLang;
        const fields = ['contact.xValue', 'contact.wechatValue', 'contact.insValue'];
        fields.forEach(key => CMSManager.setOverride(lang, key, ''));
        this.loadContactEditor();
        this.showNotification('å·²éç½®', 'success');
    },

    // --- Footer Editor ---
    loadFooterEditor() {
        const lang = document.getElementById('footerLangSelect')?.value || 'zh';
        this.data.editingLang = lang;
        const fields = ['footer.logo', 'footer.text', 'footer.note'];
        fields.forEach(key => {
            const input = document.querySelector(`#section-footer [data-cms-key="${key}"]`);
            if (input) {
                const override = CMSManager.getOverride(lang, key);
                input.value = override || '';
                input.placeholder = Language.t(key);
            }
        });
    },

    saveFooter() {
        const lang = this.data.editingLang;
        const fields = ['footer.logo', 'footer.text', 'footer.note'];
        fields.forEach(key => {
            const input = document.querySelector(`#section-footer [data-cms-key="${key}"]`);
            if (input) CMSManager.setOverride(lang, key, input.value);
        });
        this.showNotification(Language.t('admin.notificationUpdated'), 'success');
    },

    resetFooter() {
        if (!confirm('ç¡®å®è¦éç½®é¡µèä¸ºé»è®¤å¼åï¼')) return;
        const lang = this.data.editingLang;
        const fields = ['footer.logo', 'footer.text', 'footer.note'];
        fields.forEach(key => CMSManager.setOverride(lang, key, ''));
        this.loadFooterEditor();
        this.showNotification('å·²éç½®', 'success');
    },

    // --- Settings Editor ---
    loadSettingsEditor() {
        const settings = CMSManager.getAllSettings();
        const heroBgColor = document.getElementById('settingHeroBgColor');
        const heroBgImage = document.getElementById('settingHeroBgImage');
        const primaryColor = document.getElementById('settingPrimaryColor');
        const logoText = document.getElementById('settingLogoText');
        const customCSS = document.getElementById('settingCustomCSS');

        if (heroBgColor) heroBgColor.value = settings.heroBgColor || '#0f0c29';
        if (heroBgImage) heroBgImage.value = settings.heroBgImage || '';
        if (primaryColor) primaryColor.value = settings.primaryColor || '#c9a227';
        if (logoText) logoText.value = settings.logoText || '';
        if (customCSS) customCSS.value = settings.customCSS || '';
    },

    saveSettings() {
        CMSManager.setSetting('heroBgColor', document.getElementById('settingHeroBgColor')?.value || '');
        CMSManager.setSetting('heroBgImage', document.getElementById('settingHeroBgImage')?.value || '');
        CMSManager.setSetting('primaryColor', document.getElementById('settingPrimaryColor')?.value || '');
        CMSManager.setSetting('logoText', document.getElementById('settingLogoText')?.value || '');
        CMSManager.setSetting('customCSS', document.getElementById('settingCustomCSS')?.value || '');
        CMSManager.applySettings();
        this.showNotification(Language.t('admin.notificationUpdated'), 'success');
    },

    importCMS(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = CMSManager.importCMS(e.target.result);
            if (result.success) {
                this.showNotification('å¯¼å¥æå', 'success');
                this.loadSettingsEditor();
            } else {
                this.showNotification('å¯¼å¥å¤±è´¥: ' + result.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    resetAllCMS() {
        if (!confirm('ç¡®å®è¦éç½®ææCMSæ°æ®åï¼è¿å°æ¸é¤ææèªå®ä¹åå®¹ã')) return;
        CMSManager.resetCMS();
        this.loadSettingsEditor();
        this.showNotification('å·²éç½®ææCMSæ°æ®', 'success');
    },

    // --- Product Management (existing) ---
    populateSelects() {
        const brandSelect = document.getElementById('brandSelect');
        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">' + Language.t('admin.brandPlaceholder') + '</option>' +
                this.brands.map(b => `<option value="${b.slug}">${b.englishName}</option>`).join('');
        }

        const filterBrand = document.getElementById('filterBrand');
        if (filterBrand) {
            filterBrand.innerHTML = '<option value="all">' + Language.t('admin.filterAllBrand') + '</option>' +
                this.brands.map(b => `<option value="${b.slug}">${b.englishName}</option>`).join('');
        }

        const filterCategory = document.getElementById('filterCategory');
        if (filterCategory) {
            filterCategory.innerHTML = '<option value="all">' + Language.t('admin.filterAllCategory') + '</option>' +
                ['classic', 'handbags', 'accessories', 'limited'].map(c =>
                    `<option value="${c}">${Language.t('admin.category' + c.charAt(0).toUpperCase() + c.slice(1))}</option>`
                ).join('');
        }

        const productCategory = document.getElementById('productCategory');
        if (productCategory) {
            productCategory.innerHTML = ['classic', 'handbags', 'accessories', 'limited'].map(c =>
                `<option value="${c}">${Language.t('admin.category' + c.charAt(0).toUpperCase() + c.slice(1))}</option>`
            ).join('');
        }

        const langSelect = document.getElementById('langSelect');
        if (langSelect) langSelect.innerHTML = Language.getLanguageOptionsHTML();

        const productLangSelect = document.getElementById('productLangSelect');
        if (productLangSelect) productLangSelect.innerHTML = Language.getLanguageOptionsHTML();
    },

    async loadData() {
        // Only sync products.json if localStorage is empty (first visit or data cleared)
        let allProducts = DataManager.getAllProducts();
        let hasData = false;
        for (const key in allProducts) {
            if (allProducts[key] && allProducts[key].products && allProducts[key].products.length > 0) {
                hasData = true;
                break;
            }
        }
        if (!hasData) {
            try {
                const resp = await fetch('data/products.json');
                if (resp.ok) {
                    const json = await resp.json();
                    DataManager.saveAllProducts(json);
                    console.log('[Admin] Initialized products from products.json');
                    allProducts = json;
                }
            } catch (e) {
                console.warn('[Admin] Could not load products.json:', e.message);
            }
        }
        this.data.products = [];
        if (allProducts) {
            for (const brandSlug in allProducts) {
                if (allProducts[brandSlug] && allProducts[brandSlug].products) {
                    allProducts[brandSlug].products.forEach(p => {
                        this.data.products.push({ ...p, brand: brandSlug });
                    });
                }
            }
        }
        this.filterProducts();
    },

    setupEventListeners() {
        const form = document.getElementById('productForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        const modal = document.getElementById('productModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'productModal') this.closeModal();
            });
        }

        // Image upload
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('productImageFile');
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleImageFile(e.target.files[0]));
            uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length) this.handleImageFile(e.dataTransfer.files[0]);
            });
        }

        // Brand background image upload
        const brandBgUploadArea = document.getElementById('brandBgUploadArea');
        const brandBgFileInput = document.getElementById('brandBgImageFile');
        if (brandBgUploadArea && brandBgFileInput) {
            brandBgUploadArea.addEventListener('click', () => brandBgFileInput.click());
            brandBgFileInput.addEventListener('change', (e) => this.handleBrandBgFile(e.target.files[0]));
            brandBgUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); brandBgUploadArea.classList.add('dragover'); });
            brandBgUploadArea.addEventListener('dragleave', () => brandBgUploadArea.classList.remove('dragover'));
            brandBgUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                brandBgUploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length) this.handleBrandBgFile(e.dataTransfer.files[0]);
            });
        }
    },

    handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            document.getElementById('productImage').value = base64;
            this.showImagePreview(base64);
        };
        reader.readAsDataURL(file);
    },

    loadImageFromUrl() {
        const url = document.getElementById('productImage').value.trim();
        if (!url) return;
        this.showImagePreview(url);
    },

    showImagePreview(src) {
        const preview = document.getElementById('imagePreview');
        const hint = document.getElementById('imageUploadHint');
        if (preview && hint) {
            preview.src = src;
            preview.style.display = 'block';
            hint.style.display = 'none';
        }
    },

    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        const hint = document.getElementById('imageUploadHint');
        if (preview && hint) {
            preview.src = '';
            preview.style.display = 'none';
            hint.style.display = 'flex';
        }
    },

    handleFormSubmit() {
        const brand = document.getElementById('brandSelect').value;
        const lang = document.getElementById('productLangSelect')?.value || 'zh';
        const name = document.getElementById('productName').value.trim();
        const price = document.getElementById('productPrice').value.trim();
        const image = document.getElementById('productImage').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const color = document.getElementById('productColor').value.trim();
        const size = document.getElementById('productSize').value.trim();
        const category = document.getElementById('productCategory').value;
        const featured = document.getElementById('productFeatured').checked;

        if (!brand || !name || !price) {
            this.showNotification(Language.t('admin.notificationRequired'), 'error');
            return;
        }

        // Save current lang values into buffer
        this.data.productNames[lang] = name;
        this.data.productDescriptions[lang] = description;

        // Build multilingual name/description objects
        // If only one language has a value, store as plain string for backward compat
        const nameKeys = Object.keys(this.data.productNames).filter(k => this.data.productNames[k]);
        const descKeys = Object.keys(this.data.productDescriptions).filter(k => this.data.productDescriptions[k]);
        const finalName = nameKeys.length <= 1 ? (this.data.productNames['zh'] || name) : { ...this.data.productNames };
        const finalDesc = descKeys.length <= 1 ? (this.data.productDescriptions['zh'] || description) : { ...this.data.productDescriptions };

        if (this.data.editingProductId) {
            const result = DataManager.updateProduct(this.data.editingBrandSlug, this.data.editingProductId, {
                name: finalName, price, image, description: finalDesc, color, size, category, featured
            });
            if (result.success) {
                this.showNotification(Language.t('admin.notificationUpdated'), 'success');
                this.closeModal();
                this._syncAndRefresh();
            }
        } else {
            const result = DataManager.addProduct(brand, {
                name: finalName, price, image, description: finalDesc, color, size, category, featured
            });
            if (result.success) {
                this.showNotification(Language.t('admin.notificationAdded'), 'success');
                this.closeModal();
                this._syncAndRefresh();
            }
        }
    },

    // Silent sync: push localStorage â products.json on server, then refresh UI from localStorage
    async _syncAndRefresh() {
        try {
            const data = DataManager.getAllProducts();
            await API.put('/admin/products/sync', data, true);
        } catch (e) {
            console.warn('[Admin] Sync to server failed:', e.message);
        }
        // Reload products from localStorage (not from server, avoiding stale overwrite)
        const allProducts = DataManager.getAllProducts();
        this.data.products = [];
        if (allProducts) {
            for (const brandSlug in allProducts) {
                if (allProducts[brandSlug] && allProducts[brandSlug].products) {
                    allProducts[brandSlug].products.forEach(p => {
                        this.data.products.push({ ...p, brand: brandSlug });
                    });
                }
            }
        }
        this.filterProducts();
        this.renderTable();
        this.renderStats();
    },

    editProduct(productId) {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return;

        this.data.editingProductId = productId;
        this.data.editingBrandSlug = product.brand;

        // Build multilingual name/description buffers
        this.data.productNames = (typeof product.name === 'object' && product.name !== null) ? { ...product.name } : { zh: product.name || '' };
        this.data.productDescriptions = (typeof product.description === 'object' && product.description !== null) ? { ...product.description } : { zh: product.description || '' };

        const lang = document.getElementById('productLangSelect')?.value || Language.currentLang || 'zh';
        this.data.editingLang = lang;
        const displayName = this.data.productNames[lang] || this.data.productNames['zh'] || '';
        const displayDesc = this.data.productDescriptions[lang] || this.data.productDescriptions['zh'] || '';

        document.getElementById('brandSelect').value = product.brand;
        document.getElementById('productName').value = displayName;
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productImage').value = product.image || '';
        document.getElementById('productDescription').value = displayDesc;
        document.getElementById('productColor').value = product.color || '';
        document.getElementById('productSize').value = product.size || '';
        document.getElementById('productCategory').value = product.category || 'classic';
        document.getElementById('productFeatured').checked = product.featured || false;

        // Show image preview if product has image
        if (product.image) {
            const resolvedImage = (!product.image.startsWith('http')) ? Utils.resolveImage('/images/' + product.image) : product.image;
            this.showImagePreview(resolvedImage);
        } else {
            this.clearImagePreview();
        }

        // Render product gallery
        this.renderProductGallery(product);

        document.getElementById('modalTitle').textContent = Language.t('admin.editProduct');
        document.getElementById('submitBtn').textContent = Language.t('admin.saveBtn');
        document.getElementById('productModal').style.display = 'flex';
    },

    renderProductGallery(product) {
        const gallery = document.getElementById('productGallery');
        if (!gallery) return;
        gallery.innerHTML = '';

        const images = (product.images && product.images.length) ? product.images : (product.image ? [product.image] : []);
        if (!images.length) return;

        images.forEach(img => {
            const src = (!img.startsWith('http')) ? Utils.resolveImage('/images/' + img) : img;
            const isActive = (img === product.image);
            const item = document.createElement('div');
            item.className = 'gallery-item' + (isActive ? ' active' : '');
            item.setAttribute('data-img', img);

            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.alt = img;

            const btn = document.createElement('button');
            btn.className = 'gallery-set-main';
            btn.textContent = 'è®¾ä¸ºä¸»å¾';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                product.image = img;
                const previewImg = document.getElementById('imagePreview');
                if (previewImg) {
                    previewImg.src = src;
                    previewImg.style.display = 'block';
                }
                const imageInput = document.getElementById('productImage');
                if (imageInput) imageInput.value = img;
                this.renderProductGallery(product);
            });

            item.appendChild(thumb);
            item.appendChild(btn);

            item.addEventListener('click', () => {
                const previewImg = document.getElementById('imagePreview');
                if (previewImg) {
                    previewImg.src = src;
                    previewImg.style.display = 'block';
                }
                const imageInput = document.getElementById('productImage');
                if (imageInput) imageInput.value = img;
                document.querySelectorAll('#productGallery .gallery-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            });

            gallery.appendChild(item);
        });
    },

    deleteProduct(brand, productId) {
        if (confirm(Language.t('admin.confirmDelete'))) {
            const result = DataManager.deleteProduct(brand, productId);
            if (result.success) {
                this.showNotification(Language.t('admin.notificationDeleted'), 'success');
                this._syncAndRefresh();
            }
        }
    },

    openModal() {
        this.data.editingProductId = null;
        this.data.editingBrandSlug = null;
        this.data.productNames = {};
        this.data.productDescriptions = {};
        this.data.editingLang = Language.currentLang || 'zh';
        document.getElementById('productForm').reset();
        const fileInput = document.getElementById('productImageFile');
        if (fileInput) fileInput.value = '';
        this.clearImagePreview();
        const productLangSelect = document.getElementById('productLangSelect');
        if (productLangSelect) productLangSelect.value = this.data.editingLang;
        document.getElementById('modalTitle').textContent = Language.t('admin.addProduct');
        document.getElementById('submitBtn').textContent = Language.t('admin.saveBtn');
        document.getElementById('productModal').style.display = 'flex';
    },

    /** Save current lang's name/desc to buffer, then load new lang's values */
    switchProductLang() {
        const lang = document.getElementById('productLangSelect')?.value || 'zh';
        // Save current values
        const prevLang = this.data.editingLang;
        this.data.productNames[prevLang] = document.getElementById('productName')?.value || '';
        this.data.productDescriptions[prevLang] = document.getElementById('productDescription')?.value || '';
        // Track new lang
        this.data.editingLang = lang;
        // Load new lang values
        document.getElementById('productName').value = this.data.productNames[lang] || '';
        document.getElementById('productDescription').value = this.data.productDescriptions[lang] || '';
    },

    /** Translate Chinese name+description to all languages via backend API. Only fills empty fields by default. */
    async translateProduct() {
        // Save current editable values into buffer
        const currentLang = document.getElementById('productLangSelect')?.value || 'zh';
        this.data.productNames[currentLang] = document.getElementById('productName')?.value || '';
        this.data.productDescriptions[currentLang] = document.getElementById('productDescription')?.value || '';

        // Always use zh as translation source
        const zhName = this.data.productNames['zh'];
        const zhDesc = this.data.productDescriptions['zh'];

        if (!zhName && !zhDesc) {
            this.showNotification('è¯·åå¨ä¸­ææ¨¡å¼ä¸è¾å¥åååç§°ææè¿°', 'error');
            return;
        }

        // Determine which languages need translation (only fill empty ones)
        const allLangs = Object.keys(Language.nativeNames || { zh: '', en: '', ko: '', ja: '', fr: '', es: '', ar: '', ru: '', de: '', pt: '', it: '', th: '', vi: '' });
        const nameTargetLangs = zhName ? allLangs.filter(l => l !== 'zh' && (!this.data.productNames[l] || !String(this.data.productNames[l]).trim())) : [];
        const descTargetLangs = zhDesc ? allLangs.filter(l => l !== 'zh' && (!this.data.productDescriptions[l] || !String(this.data.productDescriptions[l]).trim())) : [];

        // Check if there are already filled translations that would be skipped
        const filledNameLangs = zhName ? allLangs.filter(l => l !== 'zh' && this.data.productNames[l] && String(this.data.productNames[l]).trim()) : [];
        const filledDescLangs = zhDesc ? allLangs.filter(l => l !== 'zh' && this.data.productDescriptions[l] && String(this.data.productDescriptions[l]).trim()) : [];
        const skippedLangs = new Set([...filledNameLangs, ...filledDescLangs]);

        if (nameTargetLangs.length === 0 && descTargetLangs.length === 0) {
            this.showNotification('ææè¯­è¨å·²æç¿»è¯ï¼æ éæä½', 'success');
            return;
        }

        // Build request payload
        const texts = [];
        let nameIdx = -1, descIdx = -1;
        if (zhName && nameTargetLangs.length > 0) {
            nameIdx = texts.length;
            texts.push({ text: zhName, sourceLang: 'zh', targetLangs: nameTargetLangs });
        }
        if (zhDesc && descTargetLangs.length > 0) {
            descIdx = texts.length;
            texts.push({ text: zhDesc, sourceLang: 'zh', targetLangs: descTargetLangs });
        }

        Translator.showProgress('æ­£å¨ç¿»è¯...');
        try {
            const res = await API.post('/admin/translate', { texts }, true);
            if (res.success && res.translations) {
                // Apply name translations
                if (nameIdx >= 0 && res.translations[nameIdx]) {
                    for (const [lang, text] of Object.entries(res.translations[nameIdx])) {
                        if (text && text.trim()) this.data.productNames[lang] = text;
                    }
                }
                // Apply description translations
                if (descIdx >= 0 && res.translations[descIdx]) {
                    for (const [lang, text] of Object.entries(res.translations[descIdx])) {
                        if (text && text.trim()) this.data.productDescriptions[lang] = text;
                    }
                }
                Translator.hideProgress();
                const filledCount = nameTargetLangs.length + descTargetLangs.length;
                let msg = 'ç¿»è¯å®æï¼' + filledCount + ' ç§è¯­è¨å·²å¡«å';
                if (skippedLangs.size > 0) msg += 'ï¼è·³è¿ ' + skippedLangs.size + ' ç§å·²æç¿»è¯çè¯­è¨ï¼';
                this.showNotification(msg, 'success');
            } else {
                Translator.hideProgress();
                this.showNotification('ç¿»è¯å¤±è´¥: ' + (res.message || 'æå¡å¨éè¯¯'), 'error');
            }
        } catch (err) {
            Translator.hideProgress();
            this.showNotification('ç¿»è¯å¤±è´¥: ç½ç»éè¯¯', 'error');
        }

        // Show current lang's value
        const displayLang = document.getElementById('productLangSelect')?.value || 'zh';
        document.getElementById('productName').value = this.data.productNames[displayLang] || '';
        document.getElementById('productDescription').value = this.data.productDescriptions[displayLang] || '';
    },

    /** Batch translate all existing products that only have Chinese names using backend API */
    async batchTranslateAll() {
        const allLangs = Object.keys(Language.nativeNames || { zh: '', en: '', ko: '', ja: '', fr: '', es: '', ar: '', ru: '', de: '', pt: '', it: '', th: '', vi: '' });
        const products = this.data.products.filter(p => {
            return p.name && typeof p.name === 'string' && p.name.trim();
        });
        if (!products.length) {
            this.showNotification('ææååå·²å«å¤è¯­è¨æ°æ®ï¼æ éç¿»è¯', 'success');
            return;
        }
        if (!confirm('å°ä¸º ' + products.length + ' ä¸ªä»æä¸­æåç§°çååçæå¤è¯­è¨ç¿»è¯ï¼ç¡®è®¤ç»§ç»­ï¼')) return;

        // Collect all texts to translate (batch to backend, max 20 per request)
        const texts = [];
        const productMap = []; // maps text index â {product, field}
        for (const product of products) {
            productMap.push({ product, field: 'name', text: product.name });
        }
        for (const product of products) {
            if (typeof product.description === 'string' && product.description.trim()) {
                productMap.push({ product, field: 'description', text: product.description });
            }
        }

        const targetLangs = allLangs.filter(l => l !== 'zh');
        const batches = [];
        for (let i = 0; i < productMap.length; i += 20) {
            const batch = productMap.slice(i, i + 20);
            batches.push({
                items: batch,
                texts: batch.map(item => ({ text: item.text, sourceLang: 'zh', targetLangs }))
            });
        }

        Translator.showProgress('æ¹éç¿»è¯ä¸­ 0/' + products.length + '...');
        let done = 0;
        let failed = 0;
        const productsUpdated = new Set();

        for (let b = 0; b < batches.length; b++) {
            const batch = batches[b];
            try {
                const res = await API.post('/admin/translate', { texts: batch.texts }, true);
                if (res.success && res.translations) {
                    for (let i = 0; i < batch.items.length && i < res.translations.length; i++) {
                        const { product, field } = batch.items[i];
                        const translation = res.translations[i];
                        if (translation && Object.keys(translation).length > 1) {
                            const updateData = {};
                            if (field === 'name') {
                                const nameObj = {};
                                for (const [lang, text] of Object.entries(translation)) {
                                    if (text && text.trim()) nameObj[lang] = text;
                                }
                                updateData.name = nameObj;
                                if (typeof product.description === 'string' && product.description.trim() && (!updateData.description)) {
                                    // description handled separately
                                }
                                DataManager.updateProduct(product.brand, product.id, updateData);
                            } else if (field === 'description') {
                                const descObj = {};
                                for (const [lang, text] of Object.entries(translation)) {
                                    if (text && text.trim()) descObj[lang] = text;
                                }
                                DataManager.updateProduct(product.brand, product.id, { description: descObj });
                            }
                            productsUpdated.add(product.id);
                        }
                    }
                }
                Translator.showProgress('æ¹éç¿»è¯ä¸­ ' + productsUpdated.size + '/' + products.length + '...');
            } catch (e) {
                failed += batch.items.length;
            }
        }
        Translator.hideProgress();
        done = productsUpdated.size;
        this.showNotification('ç¿»è¯å®æ: ' + done + ' æå, ' + failed + ' å¤±è´¥', done > 0 ? 'success' : 'error');
        this._syncAndRefresh();
    },

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
        this.data.editingProductId = null;
        this.data.editingBrandSlug = null;
    },

    resetForm() {
        document.getElementById('productForm').reset();
        this.data.editingProductId = null;
        this.data.editingBrandSlug = null;
    },

    filterProducts() {
        const filterBrand = document.getElementById('filterBrand')?.value || 'all';
        const filterCategory = document.getElementById('filterCategory')?.value || 'all';

        this.data.filteredProducts = this.data.products.filter(product => {
            const brandMatch = filterBrand === 'all' || product.brand === filterBrand;
            const categoryMatch = filterCategory === 'all' || product.category === filterCategory;
            return brandMatch && categoryMatch;
        });

        this.data.totalItems = this.data.filteredProducts.length;
        this.data.currentPage = 1;
        this.renderTable();
    },

    changePage(direction) {
        const totalPages = Math.ceil(this.data.totalItems / this.data.pageSize) || 1;
        const newPage = this.data.currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            this.data.currentPage = newPage;
            this.renderTable();
        }
    },

    renderTable() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const pagination = document.getElementById('paginationSection');

        if (this.data.filteredProducts.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            pagination.style.display = 'none';
            document.getElementById('totalCount').textContent = '0 ' + Language.t('admin.toolbarCount', { count: 0 });
            return;
        }

        emptyState.style.display = 'none';
        pagination.style.display = 'flex';

        const start = (this.data.currentPage - 1) * this.data.pageSize;
        const end = start + this.data.pageSize;
        const pageData = this.data.filteredProducts.slice(start, end);

        grid.innerHTML = pageData.map(product => {
            const brandInfo = BrandsConfig.getBrandBySlug(product.brand);
            const brandName = brandInfo ? brandInfo.englishName : product.brand;
            const categoryName = Language.t('admin.category' + (product.category || 'classic').charAt(0).toUpperCase() + (product.category || 'classic').slice(1));
            const price = product.price || '-';
            const displayName = DataManager.getLocalizedName(product, Language.currentLang);

            return `
                <div class="admin-product-card" data-product-id="${product.id}">
                    <div class="card-image">
                        <img src="${(product.image && !product.image.startsWith('http')) ? Utils.resolveImage('/images/' + product.image) : (product.image || 'https://via.placeholder.com/300x200/f5f5f5/cccccc?text=No+Image')}" alt="${displayName}" loading="lazy">
                    </div>
                    ${product.images && product.images.length > 1 ? `
                    <div class="card-thumbnails">
                        ${product.images.map((img, i) => {
                            const thumbSrc = (!img.startsWith('http')) ? Utils.resolveImage('/images/' + img) : img;
                            return `<img src="${thumbSrc}" class="card-thumb${i === 0 ? ' active' : ''}" data-index="${i}" alt="" loading="lazy">`;
                        }).join('')}
                    </div>
                    ` : ''}
                    <div class="card-body">
                        <h4 class="card-name">${displayName}</h4>
                        <div class="card-meta">
                            <span class="card-brand">${brandName}</span>
                            <span class="card-category">${categoryName}</span>
                        </div>
                        <div class="card-price">${price}</div>
                        <div class="card-specs">
                            ${product.color ? `<span>${product.color}</span>` : ''}
                            ${product.size ? `<span>${product.size}</span>` : ''}
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-edit" onclick="AdminApp.editProduct('${product.id}')">${Language.t('admin.editBtn')}</button>
                        <button class="btn btn-sm btn-delete" onclick="AdminApp.deleteProduct('${product.brand}', '${product.id}')">${Language.t('admin.deleteBtn')}</button>
                    </div>
                </div>
            `;
        }).join('');

        const totalPages = Math.ceil(this.data.totalItems / this.data.pageSize) || 1;
        document.getElementById('totalCount').textContent = Language.t('admin.toolbarCount', { count: this.data.totalItems });
        document.getElementById('pageInfo').textContent = `${this.data.currentPage} / ${totalPages}`;
    },

    renderStats() {
        const statsRow = document.getElementById('statsRow');
        const totalCount = this.data.products.length;

        let html = `<div class="stat-card stat-total">
            <div class="stat-number">${totalCount}</div>
            <div class="stat-label">${Language.t('admin.statsTotal')}</div>
        </div>`;

        this.brands.forEach(brand => {
            const count = this.data.products.filter(p => p.brand === brand.slug).length;
            html += `<div class="stat-card">
                <div class="stat-number">${count}</div>
                <div class="stat-label">${brand.englishName}</div>
            </div>`;
        });

        statsRow.innerHTML = html;
    },

    exportData() {
        DataManager.exportData();
        this.showNotification(Language.t('admin.notificationExported'), 'success');
    },

    async syncToServer() {
        const btn = document.getElementById('syncBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'åæ­¥ä¸­...'; }
        try {
            const data = DataManager.getAllProducts();
            const res = await API.put('/admin/products/sync', data, true);
            if (res.success) {
                this.showNotification('å·²åæ­¥å°æå¡å¨', 'success');
            } else {
                this.showNotification('åæ­¥å¤±è´¥: ' + (res.message || ''), 'error');
            }
        } catch (err) {
            this.showNotification('åæ­¥å¤±è´¥: ç½ç»éè¯¯', 'error');
        }
        if (btn) { btn.disabled = false; btn.textContent = 'åæ­¥å°æå¡å¨'; }
    },

    async syncToWebsite() {
        const btn = document.getElementById('syncSiteBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'æ­£å¨å¯¼åº...'; }

        try {
            const data = DataManager.getAllProducts();
            if (!data || Object.keys(data).length === 0) {
                this.showNotification('æ²¡æå¯å¯¼åºçååæ°æ®', 'error');
                if (btn) { btn.disabled = false; btn.textContent = 'åæ­¥å°ç½ç«'; }
                return;
            }

            // 1. Trigger browser download as products.json
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products.json';
            a.click();
            URL.revokeObjectURL(url);

            // 2. Also sync to server + save to desktop via server API
            try {
                await API.put('/admin/products/sync', data, true);
                await API.put('/admin/products/export-desktop', data, true);
            } catch (e) {
                console.warn('[Admin] Server export failed:', e.message);
            }

            this.showNotification('å¯¼åºæåï¼products.json å·²ä¸è½½å¹¶ä¿å­å°æ¡é¢', 'success');
        } catch (err) {
            this.showNotification('å¯¼åºå¤±è´¥: ' + (err.message || 'æªç¥éè¯¯'), 'error');
        }
        if (btn) { btn.disabled = false; btn.textContent = 'åæ­¥å°ç½ç«'; }
    },

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    applyLanguage() {
        const ids = {
            headerTitle: 'admin.headerTitle',
            headerSubtitle: 'admin.headerSubtitle',
            addProductBtn: 'admin.addBtn',
            exportBtn: 'admin.exportBtn',
            syncBtn: 'admin.syncBtn',
            navHome: 'admin.navHome',
            emptyTitle: 'admin.emptyTitle',
            emptyMessage: 'admin.emptyMessage',
            prevBtn: 'admin.paginationPrev',
            nextBtn: 'admin.paginationNext',
            cancelBtn: 'admin.cancelBtn',
            labelBrand: 'admin.selectBrand',
            labelCategory: 'admin.productCategory',
            labelName: 'admin.productName',
            labelPrice: 'admin.productPrice',
            labelImage: 'admin.productImage',
            labelDescription: 'admin.productDescription',
            labelColor: 'admin.productColor',
            labelSize: 'admin.productSize',
            labelFeatured: 'admin.featured'
        };
        for (const [id, key] of Object.entries(ids)) {
            const el = document.getElementById(id);
            if (el) el.textContent = Language.t(key);
        }

        this.populateSelects();
        this.populateLangSelects();
        this.renderTable();
        this.renderStats();

        // Reload current CMS section
        this.loadSectionData(this.data.activeSection);
    },

    // --- Members Management ---
    allMembers: [],
    async loadMembersEditor() {
        const grid = document.getElementById('membersGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="padding:20px;color:var(--silver)">å è½½ä¸­...</p>';

        const res = await API.get('/admin/members', true);
        if (!res.success) {
            grid.innerHTML = '<p style="padding:20px;color:#b91c1c">å è½½å¤±è´¥: ' + (res.message || '') + '</p>';
            return;
        }
        this.allMembers = res.members || [];
        this.renderMembersTable(this.allMembers);
    },

    searchMembers() {
        const query = (document.getElementById('memberSearchInput')?.value || '').trim().toLowerCase();
        if (!query) {
            this.renderMembersTable(this.allMembers);
            return;
        }
        const filtered = this.allMembers.filter(m =>
            (m.email || '').includes(query) || (m.nickname || '').toLowerCase().includes(query)
        );
        this.renderMembersTable(filtered);
    },

    renderMembersTable(members) {
        const grid = document.getElementById('membersGrid');
        if (!members.length) {
            grid.innerHTML = '<p style="padding:20px;color:var(--silver)">ææ ä¼åæ°æ®</p>';
            return;
        }
        grid.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:var(--near-white);text-align:left">
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">é®ç®±</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">æµç§°</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">è§è²</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">æ³¨åæ¶é´</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">æåç»å½</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">æä½</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(m => `
                        <tr style="border-bottom:1px solid var(--off-white)">
                            <td style="padding:10px 12px">${m.email || '-'}</td>
                            <td style="padding:10px 12px">${m.nickname || '-'}</td>
                            <td style="padding:10px 12px"><span style="padding:2px 8px;font-size:11px;background:${m.role === 'admin' ? 'var(--gold-muted)' : 'var(--off-white)'}">${m.role === 'admin' ? 'ç®¡çå' : 'ä¼å'}</span></td>
                            <td style="padding:10px 12px">${this.formatDate(m.createdAt)}</td>
                            <td style="padding:10px 12px">${this.formatDate(m.lastLoginAt)}</td>
                            <td style="padding:10px 12px"><button class="btn btn-sm btn-outline" onclick="AdminApp.viewMemberDetail('${m.id}')">è¯¦æ</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    },

    async viewMemberDetail(memberId) {
        const res = await API.get(`/admin/members/${memberId}`, true);
        if (!res.success) {
            this.showNotification('å è½½å¤±è´¥', 'error');
            return;
        }
        const m = res.member;
        const orders = res.orders || [];
        const grid = document.getElementById('membersGrid');
        grid.innerHTML = `
            <div style="margin-bottom:16px">
                <button class="btn btn-sm btn-outline" onclick="AdminApp.loadMembersEditor()">â è¿åä¼ååè¡¨</button>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px;margin-bottom:16px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">ä¼åä¿¡æ¯</h3>
                <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 12px;font-size:14px">
                    <span style="color:var(--silver)">é®ç®±</span><span>${m.email}</span>
                    <span style="color:var(--silver)">æµç§°</span><span>${m.nickname || '-'}</span>
                    <span style="color:var(--silver)">è§è²</span><span>${m.role === 'admin' ? 'ç®¡çå' : 'ä¼å'}</span>
                    <span style="color:var(--silver)">æ³¨åæ¶é´</span><span>${this.formatDate(m.createdAt)}</span>
                    <span style="color:var(--silver)">æåç»å½</span><span>${this.formatDate(m.lastLoginAt)}</span>
                </div>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">è´­ä¹°è®°å½ (${orders.length})</h3>
                ${orders.length ? orders.map(o => `
                    <div style="padding:10px 0;border-bottom:1px solid var(--off-white)">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:13px;letter-spacing:1px">${o.orderNo}</span>
                            <span style="font-size:12px;padding:2px 8px;background:${this.orderStatusBg(o.status)};color:${this.orderStatusColor(o.status)}">${this.orderStatusLabel(o.status)}</span>
                        </div>
                        <div style="font-size:12px;color:var(--silver);margin-top:4px">${o.totalAmount} Â· ${this.formatDate(o.createdAt)}</div>
                    </div>
                `).join('') : '<p style="color:var(--silver);font-size:13px">ææ è´­ä¹°è®°å½</p>'}
            </div>`;
    },

    // --- Orders Management ---
    allOrders: [],
    async loadOrdersEditor() {
        const grid = document.getElementById('ordersGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="padding:20px;color:var(--silver)">å è½½ä¸­...</p>';

        const status = document.getElementById('orderStatusFilter')?.value || '';
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        const query = params.toString() ? '?' + params.toString() : '';

        const res = await API.get(`/admin/orders${query}`, true);
        if (!res.success) {
            grid.innerHTML = '<p style="padding:20px;color:#b91c1c">å è½½å¤±è´¥: ' + (res.message || '') + '</p>';
            return;
        }
        this.allOrders = res.orders || [];
        this.renderOrdersTable(this.allOrders);
    },

    renderOrdersTable(orders) {
        const grid = document.getElementById('ordersGrid');
        if (!orders.length) {
            grid.innerHTML = '<p style="padding:20px;color:var(--silver)">ææ è®¢åæ°æ®</p>';
            return;
        }
        grid.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:var(--near-white);text-align:left">
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">è®¢åå·</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">ä¼å</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">éé¢</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">ç¶æ</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">ä¸åæ¶é´</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">å¿«éåå·</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">æä½</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr style="border-bottom:1px solid var(--off-white)">
                            <td style="padding:10px 12px;letter-spacing:1px">${o.orderNo}</td>
                            <td style="padding:10px 12px">${o.memberEmail || '-'}</td>
                            <td style="padding:10px 12px;color:var(--gold-dark)">${o.totalAmount}</td>
                            <td style="padding:10px 12px"><span style="padding:2px 8px;font-size:11px;background:${this.orderStatusBg(o.status)};color:${this.orderStatusColor(o.status)}">${this.orderStatusLabel(o.status)}</span></td>
                            <td style="padding:10px 12px">${this.formatDate(o.createdAt)}</td>
                            <td style="padding:10px 12px">${o.trackingNo || '-'}</td>
                            <td style="padding:10px 12px">
                                <button class="btn btn-sm btn-outline" onclick="AdminApp.viewOrderDetail('${o.id}')">è¯¦æ</button>
                                <button class="btn btn-sm btn-edit" onclick="AdminApp.updateOrderStatus('${o.id}','${o.status}')">ç¶æ</button>
                                ${!o.trackingNo && (o.status === 'shipped' || o.status === 'confirmed' || o.status === 'processing') ? `<button class="btn btn-sm btn-outline" onclick="AdminApp.addTracking('${o.id}')">å¿«é</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    },

    async viewOrderDetail(orderId) {
        const res = await API.get(`/admin/orders/${orderId}`, true);
        if (!res.success) {
            this.showNotification('å è½½å¤±è´¥', 'error');
            return;
        }
        const o = res.order;
        const grid = document.getElementById('ordersGrid');
        grid.innerHTML = `
            <div style="margin-bottom:16px">
                <button class="btn btn-sm btn-outline" onclick="AdminApp.loadOrdersEditor()">â è¿åè®¢ååè¡¨</button>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px;margin-bottom:16px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">è®¢åè¯¦æ</h3>
                <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 12px;font-size:14px">
                    <span style="color:var(--silver)">è®¢åå·</span><span>${o.orderNo}</span>
                    <span style="color:var(--silver)">ä¼åé®ç®±</span><span>${o.memberEmail || '-'}</span>
                    <span style="color:var(--silver)">ç¶æ</span><span style="padding:2px 8px;display:inline-block;font-size:12px;background:${this.orderStatusBg(o.status)};color:${this.orderStatusColor(o.status)}">${this.orderStatusLabel(o.status)}</span>
                    <span style="color:var(--silver)">æ»éé¢</span><span style="color:var(--gold-dark);font-size:18px;font-family:var(--serif)">${o.totalAmount}</span>
                    <span style="color:var(--silver)">å¿«éåå·</span><span>${o.trackingNo || '-'}</span>
                    <span style="color:var(--silver)">ä¸åæ¶é´</span><span>${this.formatDate(o.createdAt)}</span>
                    <span style="color:var(--silver)">å¤æ³¨</span><span>${o.remark || '-'}</span>
                </div>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px;margin-bottom:16px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">æ¶è´§å°å</h3>
                <div style="font-size:14px">
                    ${o.address?.name || ''} Â· ${o.address?.phone || ''}<br>
                    ${o.address?.province || ''}${o.address?.city || ''}${o.address?.district || ''}${o.address?.detail || ''}
                </div>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">ååæ¸å</h3>
                ${(o.items || []).map(item => `
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--off-white)">
                        <img src="${item.image}" alt="" style="width:40px;height:40px;object-fit:cover">
                        <span style="flex:1;font-size:13px">${item.name} Ã ${item.quantity || 1}</span>
                        <span style="font-size:13px;color:var(--gold-dark)">${item.price}</span>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:16px;display:flex;gap:8px">
                <button class="btn btn-sm btn-edit" onclick="AdminApp.updateOrderStatus('${o.id}','${o.status}')">æ´æ°ç¶æ</button>
                ${!o.trackingNo ? `<button class="btn btn-sm btn-outline" onclick="AdminApp.addTracking('${o.id}')">å¡«åå¿«éåå·</button>` : ''}
            </div>`;
    },

    async updateOrderStatus(orderId, currentStatus) {
        const statusFlow = ['pending', 'payment_submitted', 'confirmed', 'processing', 'shipped', 'delivered'];
        const labels = { pending: 'å¾ç¡®è®¤', payment_submitted: 'å¾æ ¸éª', confirmed: 'å·²ç¡®è®¤', processing: 'å¤çä¸­', shipped: 'å·²åè´§', delivered: 'å·²å®æ', cancelled: 'å·²åæ¶' };
        const status = prompt(`å½åç¶æ: ${labels[currentStatus] || currentStatus}\n\nå¯éç¶æ: pending/payment_submitted/confirmed/processing/shipped/delivered/cancelled\n\nè¯·è¾å¥æ°ç¶æ:`);
        if (!status || status === currentStatus) return;
        const res = await API.put(`/admin/orders/${orderId}/status`, { status }, true);
        if (res.success) {
            this.showNotification('ç¶æå·²æ´æ°', 'success');
            this.loadOrdersEditor();
        } else {
            this.showNotification(res.message || 'æ´æ°å¤±è´¥', 'error');
        }
    },

    async addTracking(orderId) {
        const trackingNo = prompt('è¯·è¾å¥å¿«éåå·:');
        if (!trackingNo) return;
        const res = await API.put(`/admin/orders/${orderId}/tracking`, { trackingNo }, true);
        if (res.success) {
            this.showNotification('å¿«éåå·å·²æ´æ°', 'success');
            this.loadOrdersEditor();
        } else {
            this.showNotification(res.message || 'æ´æ°å¤±è´¥', 'error');
        }
    },

    orderStatusLabel(status) {
        const map = { pending: 'å¾ç¡®è®¤', payment_submitted: 'å¾æ ¸éª', confirmed: 'å·²ç¡®è®¤', processing: 'å¤çä¸­', shipped: 'å·²åè´§', delivered: 'å·²å®æ', cancelled: 'å·²åæ¶' };
        return map[status] || status;
    },

    orderStatusBg(status) {
        const map = { pending: '#fef3c7', payment_submitted: '#fde68a', confirmed: '#dbeafe', processing: '#e0e7ff', shipped: '#d1fae5', delivered: '#f0fdf4', cancelled: '#f3f4f6' };
        return map[status] || '#f3f4f6';
    },

    orderStatusColor(status) {
        const map = { pending: '#92400e', payment_submitted: '#92400e', confirmed: '#1e40af', processing: '#3730a3', shipped: '#065f46', delivered: '#166534', cancelled: '#6b7280' };
        return map[status] || '#6b7280';
    },

    formatDate(iso) {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0');
    },

    // --- Settings Editor ---
    async loadSettingsEditor() {
        // Load appearance settings from CMS
        const settings = CMSManager.getSettings() || {};
        document.getElementById('settingHeroBgColor').value = settings.heroBgColor || '#0a0a0a';
        document.getElementById('settingPrimaryColor').value = settings.primaryColor || '#c9a96e';
        document.getElementById('settingHeroBgImage').value = settings.heroBgImage || '';
        document.getElementById('settingLogoText').value = settings.logoText || '';
        document.getElementById('settingCustomCSS').value = settings.customCSS || '';

        // Load USDT config from server
        try {
            const res = await API.get('/admin/usdt-config', true);
            if (res.success && res.usdt) {
                document.getElementById('settingUsdtAddress').value = res.usdt.address || '';
                document.getElementById('settingUsdtNetwork').value = res.usdt.network || 'TRC20';
                document.getElementById('settingUsdtRate').value = res.usdt.rate || 7.2;
            }
        } catch (e) {
            console.error('Failed to load USDT config:', e);
        }
    },

    async saveSettings() {
        // Save appearance settings to CMS
        const settings = CMSManager.getSettings() || {};
        settings.heroBgColor = document.getElementById('settingHeroBgColor').value;
        settings.primaryColor = document.getElementById('settingPrimaryColor').value;
        settings.heroBgImage = document.getElementById('settingHeroBgImage').value;
        settings.logoText = document.getElementById('settingLogoText').value;
        settings.customCSS = document.getElementById('settingCustomCSS').value;
        CMSManager.setSettings(settings);

        // Save USDT config to server
        const address = document.getElementById('settingUsdtAddress').value.trim();
        const network = document.getElementById('settingUsdtNetwork').value;
        const rate = parseFloat(document.getElementById('settingUsdtRate').value);

        if (!address) {
            this.showNotification('è¯·è¾å¥ USDT å°å', 'error');
            return;
        }

        try {
            const res = await API.post('/admin/usdt-config', { address, network, rate }, true);
            if (res.success) {
                this.showNotification('USDT éç½®å·²ä¿å­', 'success');
            } else {
                this.showNotification(res.message || 'ä¿å­å¤±è´¥', 'error');
            }
        } catch (e) {
            this.showNotification('ç½ç»éè¯¯ï¼ä¿å­å¤±è´¥', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});
