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
                    <span>特性 ${i + 1}</span>
                    <button class="btn btn-sm btn-delete" onclick="AdminApp.removeFeature(${i})">删除</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>图标</label>
                        <input type="text" class="feature-icon-input" value="${f.icon || ''}" style="max-width:80px">
                    </div>
                    <div class="form-group">
                        <label>标题</label>
                        <input type="text" class="feature-title-input" value="${f.title?.[lang] || ''}" placeholder="${f.title?.zh || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea class="feature-desc-input" rows="2">${f.desc?.[lang] || ''}</textarea>
                </div>
            </div>
        `).join('');
    },

    addFeature() {
        const features = CMSManager.getQualityFeatures() || [];
        const lang = this.data.editingLang;
        const newFeature = { icon: '✨', title: {}, desc: {} };
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
        if (!confirm('确定要重置首页内容为默认值吗？')) return;
        const lang = this.data.editingLang;
        const fields = ['hero.subtitle', 'hero.title', 'hero.description', 'hero.explore',
                        'brands.title', 'brands.subtitle', 'quality.title', 'quality.subtitle'];
        fields.forEach(key => CMSManager.setOverride(lang, key, ''));
        this.loadHomepageEditor();
        this.showNotification('已重置', 'success');
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
        if (!confirm('确定要重置此品牌信息为默认值吗？')) return;
        CMSManager.resetCMS();
        this.loadBrandsEditor();
        this.showNotification('已重置', 'success');
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
            this.showNotification('请填写品牌名称', 'error');
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
                this.showNotification('品牌名称已保存，首页已生效', 'success');
            } else {
                this.showNotification(res.message || '保存失败', 'error');
            }
        } catch (e) {
            this.showNotification('网络错误，保存失败', 'error');
        }
    },

    /** Translate all 10 brand names from Chinese to all 12 other languages,
     *  then write results to js/i18n/*.js files via backend API. */
    async translateBrandNames() {
        if (!confirm('将把10个品牌的中文名称翻译为其他12种语言并写入i18n文件。\n\n请确保已先保存品牌中文名称。\n\n确认继续？')) return;

        Translator.showProgress('正在翻译品牌名称（约需30秒）...');
        try {
            const res = await API.post('/admin/translate-brands', {}, true);
            Translator.hideProgress();
            if (res.success) {
                // Refresh brand names editor to show latest from i18n
                this.showNotification(res.message || '翻译完成', 'success');
                // Reload the page to pick up new i18n files
                setTimeout(() => {
                    if (confirm('翻译已完成，刷新页面以加载新的品牌名称？')) {
                        location.reload();
                    }
                }, 500);
            } else {
                this.showNotification(res.message || '翻译失败', 'error');
            }
        } catch (e) {
            Translator.hideProgress();
            this.showNotification('翻译失败: 网络错误', 'error');
        }
    },

    // --- Brand Background Image ---
    handleBrandBgFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            document.getElementById('brandBgImageUrl').value = base64;
            this.updateBrandBgPreview(base64);
        };
        reader.readAsDataURL(file);
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
        if (!confirm('确定要重置联系方式为默认值吗？')) return;
        const lang = this.data.editingLang;
        const fields = ['contact.xValue', 'contact.wechatValue', 'contact.insValue'];
        fields.forEach(key => CMSManager.setOverride(lang, key, ''));
        this.loadContactEditor();
        this.showNotification('已重置', 'success');
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
        if (!confirm('确定要重置页脚为默认值吗？')) return;
        const lang = this.data.editingLang;
        const fields = ['footer.logo', 'footer.text', 'footer.note'];
        fields.forEach(key => CMSManager.setOverride(lang, key, ''));
        this.loadFooterEditor();
        this.showNotification('已重置', 'success');
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
                this.showNotification('导入成功', 'success');
                this.loadSettingsEditor();
            } else {
                this.showNotification('导入失败: ' + result.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    resetAllCMS() {
        if (!confirm('确定要重置所有CMS数据吗？这将清除所有自定义内容。')) return;
        CMSManager.resetCMS();
        this.loadSettingsEditor();
        this.showNotification('已重置所有CMS数据', 'success');
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
        // Auto-sync products.json into localStorage on every load
        try {
            const resp = await fetch('data/products.json');
            if (resp.ok) {
                const json = await resp.json();
                DataManager.saveAllProducts(json);
                console.log('[Admin] Synced products.json → localStorage');
            }
        } catch (e) {
            console.warn('[Admin] Could not sync products.json:', e.message);
        }

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

    // Silent sync: push localStorage → products.json on server, then refresh UI from localStorage
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
            this.showImagePreview(product.image);
        } else {
            this.clearImagePreview();
        }

        document.getElementById('modalTitle').textContent = Language.t('admin.editProduct');
        document.getElementById('submitBtn').textContent = Language.t('admin.saveBtn');
        document.getElementById('productModal').style.display = 'flex';
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
            this.showNotification('请先在中文模式下输入商品名称或描述', 'error');
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
            this.showNotification('所有语言已有翻译，无需操作', 'success');
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

        Translator.showProgress('正在翻译...');
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
                let msg = '翻译完成，' + filledCount + ' 种语言已填充';
                if (skippedLangs.size > 0) msg += '（跳过 ' + skippedLangs.size + ' 种已有翻译的语言）';
                this.showNotification(msg, 'success');
            } else {
                Translator.hideProgress();
                this.showNotification('翻译失败: ' + (res.message || '服务器错误'), 'error');
            }
        } catch (err) {
            Translator.hideProgress();
            this.showNotification('翻译失败: 网络错误', 'error');
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
            this.showNotification('所有商品已含多语言数据，无需翻译', 'success');
            return;
        }
        if (!confirm('将为 ' + products.length + ' 个仅有中文名称的商品生成多语言翻译，确认继续？')) return;

        // Collect all texts to translate (batch to backend, max 20 per request)
        const texts = [];
        const productMap = []; // maps text index → {product, field}
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

        Translator.showProgress('批量翻译中 0/' + products.length + '...');
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
                Translator.showProgress('批量翻译中 ' + productsUpdated.size + '/' + products.length + '...');
            } catch (e) {
                failed += batch.items.length;
            }
        }
        Translator.hideProgress();
        done = productsUpdated.size;
        this.showNotification('翻译完成: ' + done + ' 成功, ' + failed + ' 失败', done > 0 ? 'success' : 'error');
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
                <div class="admin-product-card">
                    <div class="card-image">
                        <img src="${product.image || 'https://via.placeholder.com/300x200/f5f5f5/cccccc?text=No+Image'}" alt="${displayName}" loading="lazy">
                    </div>
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
        if (btn) { btn.disabled = true; btn.textContent = '同步中...'; }
        try {
            const data = DataManager.getAllProducts();
            const res = await API.put('/admin/products/sync', data, true);
            if (res.success) {
                this.showNotification('已同步到服务器', 'success');
            } else {
                this.showNotification('同步失败: ' + (res.message || ''), 'error');
            }
        } catch (err) {
            this.showNotification('同步失败: 网络错误', 'error');
        }
        if (btn) { btn.disabled = false; btn.textContent = '同步到服务器'; }
    },

    async syncToWebsite() {
        const btn = document.getElementById('syncSiteBtn');
        if (btn) { btn.disabled = true; btn.textContent = '正在导出...'; }

        try {
            const data = DataManager.getAllProducts();
            if (!data || Object.keys(data).length === 0) {
                this.showNotification('没有可导出的商品数据', 'error');
                if (btn) { btn.disabled = false; btn.textContent = '同步到网站'; }
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

            this.showNotification('导出成功！products.json 已下载并保存到桌面', 'success');
        } catch (err) {
            this.showNotification('导出失败: ' + (err.message || '未知错误'), 'error');
        }
        if (btn) { btn.disabled = false; btn.textContent = '同步到网站'; }
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
        grid.innerHTML = '<p style="padding:20px;color:var(--silver)">加载中...</p>';

        const res = await API.get('/admin/members', true);
        if (!res.success) {
            grid.innerHTML = '<p style="padding:20px;color:#b91c1c">加载失败: ' + (res.message || '') + '</p>';
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
            grid.innerHTML = '<p style="padding:20px;color:var(--silver)">暂无会员数据</p>';
            return;
        }
        grid.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:var(--near-white);text-align:left">
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">邮箱</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">昵称</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">角色</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">注册时间</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">最后登录</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(m => `
                        <tr style="border-bottom:1px solid var(--off-white)">
                            <td style="padding:10px 12px">${m.email || '-'}</td>
                            <td style="padding:10px 12px">${m.nickname || '-'}</td>
                            <td style="padding:10px 12px"><span style="padding:2px 8px;font-size:11px;background:${m.role === 'admin' ? 'var(--gold-muted)' : 'var(--off-white)'}">${m.role === 'admin' ? '管理员' : '会员'}</span></td>
                            <td style="padding:10px 12px">${this.formatDate(m.createdAt)}</td>
                            <td style="padding:10px 12px">${this.formatDate(m.lastLoginAt)}</td>
                            <td style="padding:10px 12px"><button class="btn btn-sm btn-outline" onclick="AdminApp.viewMemberDetail('${m.id}')">详情</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    },

    async viewMemberDetail(memberId) {
        const res = await API.get(`/admin/members/${memberId}`, true);
        if (!res.success) {
            this.showNotification('加载失败', 'error');
            return;
        }
        const m = res.member;
        const orders = res.orders || [];
        const grid = document.getElementById('membersGrid');
        grid.innerHTML = `
            <div style="margin-bottom:16px">
                <button class="btn btn-sm btn-outline" onclick="AdminApp.loadMembersEditor()">← 返回会员列表</button>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px;margin-bottom:16px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">会员信息</h3>
                <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 12px;font-size:14px">
                    <span style="color:var(--silver)">邮箱</span><span>${m.email}</span>
                    <span style="color:var(--silver)">昵称</span><span>${m.nickname || '-'}</span>
                    <span style="color:var(--silver)">角色</span><span>${m.role === 'admin' ? '管理员' : '会员'}</span>
                    <span style="color:var(--silver)">注册时间</span><span>${this.formatDate(m.createdAt)}</span>
                    <span style="color:var(--silver)">最后登录</span><span>${this.formatDate(m.lastLoginAt)}</span>
                </div>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">购买记录 (${orders.length})</h3>
                ${orders.length ? orders.map(o => `
                    <div style="padding:10px 0;border-bottom:1px solid var(--off-white)">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:13px;letter-spacing:1px">${o.orderNo}</span>
                            <span style="font-size:12px;padding:2px 8px;background:${this.orderStatusBg(o.status)};color:${this.orderStatusColor(o.status)}">${this.orderStatusLabel(o.status)}</span>
                        </div>
                        <div style="font-size:12px;color:var(--silver);margin-top:4px">${o.totalAmount} · ${this.formatDate(o.createdAt)}</div>
                    </div>
                `).join('') : '<p style="color:var(--silver);font-size:13px">暂无购买记录</p>'}
            </div>`;
    },

    // --- Orders Management ---
    allOrders: [],
    async loadOrdersEditor() {
        const grid = document.getElementById('ordersGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="padding:20px;color:var(--silver)">加载中...</p>';

        const status = document.getElementById('orderStatusFilter')?.value || '';
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        const query = params.toString() ? '?' + params.toString() : '';

        const res = await API.get(`/admin/orders${query}`, true);
        if (!res.success) {
            grid.innerHTML = '<p style="padding:20px;color:#b91c1c">加载失败: ' + (res.message || '') + '</p>';
            return;
        }
        this.allOrders = res.orders || [];
        this.renderOrdersTable(this.allOrders);
    },

    renderOrdersTable(orders) {
        const grid = document.getElementById('ordersGrid');
        if (!orders.length) {
            grid.innerHTML = '<p style="padding:20px;color:var(--silver)">暂无订单数据</p>';
            return;
        }
        grid.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:var(--near-white);text-align:left">
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">订单号</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">会员</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">金额</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">状态</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">下单时间</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">快递单号</th>
                        <th style="padding:10px 12px;border-bottom:1px solid var(--pale)">操作</th>
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
                                <button class="btn btn-sm btn-outline" onclick="AdminApp.viewOrderDetail('${o.id}')">详情</button>
                                <button class="btn btn-sm btn-edit" onclick="AdminApp.updateOrderStatus('${o.id}','${o.status}')">状态</button>
                                ${!o.trackingNo && (o.status === 'shipped' || o.status === 'confirmed' || o.status === 'processing') ? `<button class="btn btn-sm btn-outline" onclick="AdminApp.addTracking('${o.id}')">快递</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    },

    async viewOrderDetail(orderId) {
        const res = await API.get(`/admin/orders/${orderId}`, true);
        if (!res.success) {
            this.showNotification('加载失败', 'error');
            return;
        }
        const o = res.order;
        const grid = document.getElementById('ordersGrid');
        grid.innerHTML = `
            <div style="margin-bottom:16px">
                <button class="btn btn-sm btn-outline" onclick="AdminApp.loadOrdersEditor()">← 返回订单列表</button>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px;margin-bottom:16px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">订单详情</h3>
                <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 12px;font-size:14px">
                    <span style="color:var(--silver)">订单号</span><span>${o.orderNo}</span>
                    <span style="color:var(--silver)">会员邮箱</span><span>${o.memberEmail || '-'}</span>
                    <span style="color:var(--silver)">状态</span><span style="padding:2px 8px;display:inline-block;font-size:12px;background:${this.orderStatusBg(o.status)};color:${this.orderStatusColor(o.status)}">${this.orderStatusLabel(o.status)}</span>
                    <span style="color:var(--silver)">总金额</span><span style="color:var(--gold-dark);font-size:18px;font-family:var(--serif)">${o.totalAmount}</span>
                    <span style="color:var(--silver)">快递单号</span><span>${o.trackingNo || '-'}</span>
                    <span style="color:var(--silver)">下单时间</span><span>${this.formatDate(o.createdAt)}</span>
                    <span style="color:var(--silver)">备注</span><span>${o.remark || '-'}</span>
                </div>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px;margin-bottom:16px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">收货地址</h3>
                <div style="font-size:14px">
                    ${o.address?.name || ''} · ${o.address?.phone || ''}<br>
                    ${o.address?.province || ''}${o.address?.city || ''}${o.address?.district || ''}${o.address?.detail || ''}
                </div>
            </div>
            <div style="background:var(--white);border:1px solid var(--off-white);padding:20px">
                <h3 style="font-family:var(--serif);font-size:16px;margin-bottom:12px;letter-spacing:2px">商品清单</h3>
                ${(o.items || []).map(item => `
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--off-white)">
                        <img src="${item.image}" alt="" style="width:40px;height:40px;object-fit:cover">
                        <span style="flex:1;font-size:13px">${item.name} × ${item.quantity || 1}</span>
                        <span style="font-size:13px;color:var(--gold-dark)">${item.price}</span>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:16px;display:flex;gap:8px">
                <button class="btn btn-sm btn-edit" onclick="AdminApp.updateOrderStatus('${o.id}','${o.status}')">更新状态</button>
                ${!o.trackingNo ? `<button class="btn btn-sm btn-outline" onclick="AdminApp.addTracking('${o.id}')">填写快递单号</button>` : ''}
            </div>`;
    },

    async updateOrderStatus(orderId, currentStatus) {
        const statusFlow = ['pending', 'payment_submitted', 'confirmed', 'processing', 'shipped', 'delivered'];
        const labels = { pending: '待确认', payment_submitted: '待核验', confirmed: '已确认', processing: '处理中', shipped: '已发货', delivered: '已完成', cancelled: '已取消' };
        const status = prompt(`当前状态: ${labels[currentStatus] || currentStatus}\n\n可选状态: pending/payment_submitted/confirmed/processing/shipped/delivered/cancelled\n\n请输入新状态:`);
        if (!status || status === currentStatus) return;
        const res = await API.put(`/admin/orders/${orderId}/status`, { status }, true);
        if (res.success) {
            this.showNotification('状态已更新', 'success');
            this.loadOrdersEditor();
        } else {
            this.showNotification(res.message || '更新失败', 'error');
        }
    },

    async addTracking(orderId) {
        const trackingNo = prompt('请输入快递单号:');
        if (!trackingNo) return;
        const res = await API.put(`/admin/orders/${orderId}/tracking`, { trackingNo }, true);
        if (res.success) {
            this.showNotification('快递单号已更新', 'success');
            this.loadOrdersEditor();
        } else {
            this.showNotification(res.message || '更新失败', 'error');
        }
    },

    orderStatusLabel(status) {
        const map = { pending: '待确认', payment_submitted: '待核验', confirmed: '已确认', processing: '处理中', shipped: '已发货', delivered: '已完成', cancelled: '已取消' };
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
            this.showNotification('请输入 USDT 地址', 'error');
            return;
        }

        try {
            const res = await API.post('/admin/usdt-config', { address, network, rate }, true);
            if (res.success) {
                this.showNotification('USDT 配置已保存', 'success');
            } else {
                this.showNotification(res.message || '保存失败', 'error');
            }
        } catch (e) {
            this.showNotification('网络错误，保存失败', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});
