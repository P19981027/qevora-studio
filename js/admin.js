

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
