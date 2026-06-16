// 品牌通用页面逻辑 - 复古黑白灰风格
const BrandPage = {
    TOTAL_SLOTS: 0,
    data: {
        currentCategory: 'all',
        products: [],
        brandInfo: {},
        brandSlug: '',
        galleryImages: [],
        galleryIndex: 0
    },

    async init(slug) {
        // Auto-sync products.json into localStorage so brand pages get latest data
        try {
            const resp = await fetch('../../data/products.json');
            if (resp.ok) {
                const json = await resp.json();
                DataManager.saveAllProducts(json);
            }
        } catch (e) {
            // file:// might fail silently, localStorage fallback still works
        }

        this.data.brandSlug = slug;
        this.data.brandInfo = BrandsConfig.getBrandBySlug(slug) || { name: '', englishName: '', description: '' };

        if (typeof CMSManager !== 'undefined') {
            CMSManager.applyToBrandsConfig();
            this.data.brandInfo = BrandsConfig.getBrandBySlug(slug) || this.data.brandInfo;
        }

        this.buildPage();
        this.loadProducts();
        this.bindEvents();
    },

    buildPage() {
        const brand = this.data.brandInfo;
        const slug = this.data.brandSlug;
        const app = document.getElementById('app');
        if (!app) return;

        const lang = Language.currentLang;
        const cmsBrand = (typeof CMSManager !== 'undefined') ? CMSManager.getBrandData(slug) : null;
        const heroTitle = cmsBrand?.heroTitle?.[lang] || Language.t('brand.heroTitle', { englishName: brand.englishName });
        const heroPrice = cmsBrand?.heroPrice?.[lang] || Language.t('brand.heroPrice');
        const heroDesc = cmsBrand?.heroDesc?.[lang] || Language.t('brand.heroDesc');
        const introTitle = cmsBrand?.introTitle?.[lang] || Language.t('brand.introTitle', { englishName: brand.englishName });
        const introP1 = cmsBrand?.introP1?.[lang] || Language.t('brand.introP1', { englishName: brand.englishName });
        const introP2 = cmsBrand?.introP2?.[lang] || Language.t('brand.introP2');

        app.innerHTML = `
            <nav class="brand-nav">
                <div class="nav-container">
                    <a href="../../index.html" class="nav-logo" data-i18n="nav.logo"><img src="../../images/logo.png" alt="Logo" class="nav-logo-img"> Qevora Studio</a>
                    <div class="nav-middle">
                        <a href="../../index.html" class="nav-back" data-i18n="nav.backHome">返回首页</a>
                    </div>
                    <div class="nav-icons">
                        <div class="lang-switch">
                            <select id="langSelect" onchange="Language.changeLanguage(this.value)">
                                ${Language.getLanguageOptionsHTML()}
                            </select>
                        </div>
                    </div>
                </div>
            </nav>

            <section class="brand-hero">
                <div class="brand-hero-bg"></div>
                <div class="brand-hero-content">
                    <p class="brand-hero-subtitle" data-i18n="hero.subtitle">Classique · Luxe · Raffinement</p>
                    <h1 class="brand-hero-title">${heroTitle}</h1>
                    <hr class="vintage-rule">
                    <p class="brand-hero-price">${heroPrice}</p>
                    <p class="brand-hero-description">${heroDesc}</p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary" onclick="scrollToProducts()" data-i18n="brand.exploreBtn">浏览商品</button>
                    </div>
                </div>
            </section>

            <section class="brand-intro">
                <div class="brand-intro-content">
                    <div class="vintage-divider">※</div>
                    <h2>${introTitle}</h2>
                    <hr class="vintage-rule-double">
                    <p>${introP1}</p>
                    <p>${introP2}</p>
                </div>
            </section>

            <section class="products-section" id="products">
                <div class="section-header">
                    <div class="vintage-divider">❧</div>
                    <h2 data-i18n="products.title">商品系列</h2>
                    <hr class="vintage-rule-double">
                    <p data-i18n="products.subtitle">精选原创手工包款</p>
                </div>
                <div class="product-categories">
                    <button class="category-btn active" onclick="BrandPage.filterProducts('all')" data-i18n="products.all">全部商品</button>
                    <button class="category-btn" onclick="BrandPage.filterProducts('classic')" data-i18n="products.classic">经典款</button>
                    <button class="category-btn" onclick="BrandPage.filterProducts('handbags')" data-i18n="products.handbags">手袋</button>
                    <button class="category-btn" onclick="BrandPage.filterProducts('accessories')" data-i18n="products.accessories">配饰</button>
                    <button class="category-btn" onclick="BrandPage.filterProducts('limited')" data-i18n="products.limited">限量款</button>
                </div>
                <div class="products-grid" id="productsGrid"></div>
            </section>

            <section class="quality-section">
                <div class="section-header">
                    <div class="vintage-divider">✦</div>
                    <h2 data-i18n="quality.title">品质保证</h2>
                    <hr class="vintage-rule-double">
                    <p data-i18n="quality.subtitle">每一件产品都经过严格品质把控</p>
                </div>
                <div class="quality-features" id="qualityFeatures"></div>
            </section>

            <section class="contact-section">
                <div class="section-header">
                    <div class="vintage-divider">◆</div>
                    <h2 data-i18n="contact.title">联系我们</h2>
                    <hr class="vintage-rule-double">
                    <p data-i18n="contact.subtitle">尊享一对一专属服务</p>
                </div>
                <div class="contact-items">
                    <div class="contact-item">
                        <div class="contact-label" data-i18n="contact.x">X</div>
                        <div class="contact-value" data-i18n="contact.xValue">@QevoraStudio</div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-label" data-i18n="contact.wechat">微信</div>
                        <div class="contact-value" data-i18n="contact.wechatValue">QevoraStudio</div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-label" data-i18n="contact.ins">Instagram</div>
                        <div class="contact-value" data-i18n="contact.insValue">@QevoraStudio</div>
                    </div>
                </div>
            </section>

            <footer class="brand-footer">
                <div class="footer-watermark"></div>
                <div class="footer-content">
                    <img src="../../images/logo.png" alt="" class="footer-logo-img-main">
                    <p class="footer-logo" data-i18n="footer.logo">Qevora Studio</p>
                    <hr class="vintage-rule" style="background: var(--gold); width: 30px; margin-bottom: 20px;">
                    <p class="footer-text" data-i18n="footer.text">原创手工包 · 小批量制作 · 真实展示</p>
                    <p class="footer-note" data-i18n="footer.note">请使用原创设计、合法素材和真实商品信息</p>
                </div>
            </footer>

            <div class="product-detail-overlay" id="productDetailOverlay" onclick="closeProductDetail()">
                <div class="product-detail-modal" onclick="event.stopPropagation()">
                    <button class="product-detail-close" onclick="closeProductDetail()">&times;</button>
                    <div class="product-detail-image">
                        <div class="detail-gallery">
                            <img id="detailImage" src="" alt="">
                            <button class="gallery-arrow gallery-prev" onclick="BrandPage.galleryPrev()">&#10094;</button>
                            <button class="gallery-arrow gallery-next" onclick="BrandPage.galleryNext()">&#10095;</button>
                        </div>
                        <div class="gallery-thumbs" id="galleryThumbs"></div>
                    </div>
                    <div class="product-detail-info">
                        <h2 id="detailName"></h2>
                        <p class="product-detail-price" id="detailPrice"></p>
                        <p class="product-detail-desc" id="detailDesc"></p>
                        <div class="product-detail-specs" id="detailSpecs">
                            <div class="detail-spec-row"><span class="detail-spec-label" data-i18n="products.color">颜色</span><span class="detail-spec-value" id="detailColor"></span></div>
                            <div class="detail-spec-row"><span class="detail-spec-label" data-i18n="products.size">尺寸</span><span class="detail-spec-value" id="detailSize"></span></div>
                        </div>
                        <div class="detail-actions">
                            <button class="btn btn-secondary" id="detailCartBtn">
                                <span data-i18n="products.addToCart">加入购物车</span>
                            </button>
                        </div>
                        <div class="detail-trust">
                            <span>✓ 正品保证</span><span>✓ 实物拍摄</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderQualityFeatures();
        Language.applyLanguage();
    },

    renderQualityFeatures() {
        const container = document.getElementById('qualityFeatures');
        if (!container) return;

        const lang = Language.currentLang;
        const cmsFeatures = (typeof CMSManager !== 'undefined') ? CMSManager.getQualityFeatures() : null;

        if (cmsFeatures && cmsFeatures.length > 0) {
            container.innerHTML = cmsFeatures.map((f, i) => `
                <div class="quality-card">
                    <div class="quality-icon" data-i18n="quality.features.${i}.icon">${f.icon || ''}</div>
                    <h3 data-i18n="quality.features.${i}.title">${f.title?.[lang] || Language.t('quality.features.' + i + '.title')}</h3>
                    <p data-i18n="quality.features.${i}.desc">${f.desc?.[lang] || Language.t('quality.features.' + i + '.desc')}</p>
                </div>
            `).join('');
        } else {
            const features = [];
            for (let i = 0; i < 4; i++) {
                features.push(`
                    <div class="quality-card">
                        <div class="quality-icon" data-i18n="quality.features.${i}.icon">◆</div>
                        <h3 data-i18n="quality.features.${i}.title">品质</h3>
                        <p data-i18n="quality.features.${i}.desc">描述</p>
                    </div>
                `);
            }
            container.innerHTML = features.join('');
            const transObj = Language.translations[Language.currentLang];
            if (transObj && transObj.quality && transObj.quality.features) {
                container.querySelectorAll('.quality-card').forEach((card, i) => {
                    const f = transObj.quality.features[i];
                    if (f) {
                        card.querySelector('.quality-icon').textContent = f.icon;
                        card.querySelector('h3').textContent = f.title;
                        card.querySelector('p').textContent = f.desc;
                    }
                });
            }
        }
    },

    bindEvents() {
        window.scrollToProducts = () => {
            const section = document.getElementById('products');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        };
        window.showProductDetail = (id) => {
            const product = this.data.products.find(p => p.id === id);
            if (!product) return;
            const lang = Language.currentLang;
            const productName = (typeof product.name === 'object' && product.name !== null)
                ? (product.name[lang] || product.name['zh'] || product.name['en'] || Object.values(product.name)[0] || '')
                : (product.name || '');
            const productDesc = (typeof product.description === 'object' && product.description !== null)
                ? (product.description[lang] || product.description['zh'] || product.description['en'] || Object.values(product.description)[0] || '')
                : (product.description || '');
            const price = product.price
                ? (typeof product.price === 'number' ? '¥' + product.price.toLocaleString() : product.price)
                : '';
            // Collect all images
            const rawImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
            this.data.galleryImages = rawImages.map(img => img && !img.startsWith('http') ? Utils.resolveImage('/images/' + img) : img);
            this.data.galleryIndex = 0;
            const detailImageSrc = this.data.galleryImages[0] || '';
            const overlay = document.getElementById('productDetailOverlay');
            const detailImage = document.getElementById('detailImage');
            const detailName = document.getElementById('detailName');
            const detailPrice = document.getElementById('detailPrice');
            const detailDesc = document.getElementById('detailDesc');
            const detailColor = document.getElementById('detailColor');
            const detailSize = document.getElementById('detailSize');
            const detailCartBtn = document.getElementById('detailCartBtn');
            const thumbsContainer = document.getElementById('galleryThumbs');
            // Render thumbnails
            if (thumbsContainer && this.data.galleryImages.length > 1) {
                thumbsContainer.innerHTML = this.data.galleryImages.map((img, i) =>
                    `<div class="gallery-thumb${i === 0 ? ' active' : ''}" onclick="BrandPage.galleryJump(${i})"><img src="${img}" alt=""></div>`
                ).join('');
                thumbsContainer.style.display = 'flex';
            } else if (thumbsContainer) {
                thumbsContainer.style.display = 'none';
            }
            // Show/hide arrows
            this.updateGalleryArrows();
            if (overlay && detailName) {
                if (detailImage) { detailImage.src = detailImageSrc; detailImage.alt = productName; }
                detailName.textContent = productName;
                detailPrice.textContent = price;
                detailDesc.textContent = productDesc;
                if (detailColor) detailColor.textContent = product.color || '-';
                if (detailSize) detailSize.textContent = product.size || '-';
                if (detailCartBtn) detailCartBtn.setAttribute('onclick', `addToCart('${product.id}')`);
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                alert(productName + '\n' + price + '\n' + productDesc);
            }
        };
        window.closeProductDetail = () => {
            const overlay = document.getElementById('productDetailOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
        window.addToCart = (productId) => {
            const product = this.data.products.find(p => p.id === productId);
            if (!product) return;
            const lang = Language.currentLang;
            const productName = (typeof product.name === 'object' && product.name !== null)
                ? (product.name[lang] || product.name['zh'] || product.name['en'] || Object.values(product.name)[0] || '')
                : (product.name || '');
            const price = product.price
                ? (typeof product.price === 'number' ? '¥' + product.price.toLocaleString() : product.price)
                : '¥0';
            Cart.add(
                productId,
                this.data.brandSlug,
                productName,
                price,
                product.image || '',
                1,
                { color: product.color || '', size: product.size || '' }
            ).then(res => {
                if (res.success) {
                    const btn = document.querySelector(`[data-cart-id="${productId}"]`);
                    if (btn) {
                        btn.textContent = Language.t('cart.title') + ' ✓';
                        btn.classList.add('added');
                        setTimeout(() => {
                            btn.textContent = Language.t('products.detail');
                            btn.classList.remove('added');
                        }, 1500);
                    }
                }
            });
        };
    },

    updateGalleryArrows() {
        const prev = document.querySelector('.gallery-prev');
        const next = document.querySelector('.gallery-next');
        if (prev) prev.style.display = this.data.galleryImages.length > 1 ? 'flex' : 'none';
        if (next) next.style.display = this.data.galleryImages.length > 1 ? 'flex' : 'none';
    },

    galleryPrev() {
        if (this.data.galleryImages.length === 0) return;
        this.data.galleryIndex = (this.data.galleryIndex - 1 + this.data.galleryImages.length) % this.data.galleryImages.length;
        this.applyGalleryIndex();
    },

    galleryNext() {
        if (this.data.galleryImages.length === 0) return;
        this.data.galleryIndex = (this.data.galleryIndex + 1) % this.data.galleryImages.length;
        this.applyGalleryIndex();
    },

    galleryJump(index) {
        if (index >= 0 && index < this.data.galleryImages.length) {
            this.data.galleryIndex = index;
            this.applyGalleryIndex();
        }
    },

    applyGalleryIndex() {
        const detailImage = document.getElementById('detailImage');
        if (detailImage) {
            detailImage.src = this.data.galleryImages[this.data.galleryIndex];
        }
        // Update active thumbnail
        document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === this.data.galleryIndex);
            if (i === this.data.galleryIndex) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
    },

    async loadProducts() {
        // Try server API first (when accessed via localhost), fallback to localStorage
        try {
            if (typeof API !== 'undefined' && window.location.protocol !== 'file:') {
                const res = await API.get(`/products/${this.data.brandSlug}`);
                if (res.success && res.data && res.data.products) {
                    this.data.products = res.data.products;
                    this.renderProducts();
                    return;
                }
            }
        } catch (e) {
            // Fallback to localStorage
        }
        // Sync from JSON file before reading localStorage
        await DataManager.syncFromFile();
        const data = DataManager.getBrandProducts(this.data.brandSlug);
        if (data && data.products) {
            this.data.products = data.products;
        }
        this.renderProducts();
    },

    filterProducts(category) {
        this.data.currentCategory = category;
        this.renderProducts();
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.category-btn').forEach(btn => {
            const btnCategory = btn.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
            if (btnCategory === category) btn.classList.add('active');
        });
    },

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        let realProducts = this.data.products;
        if (this.data.currentCategory !== 'all') {
            realProducts = realProducts.filter(p => p.category === this.data.currentCategory);
        }

        const realCount = realProducts.length;
        const placeholderCount = Math.max(0, this.TOTAL_SLOTS - realCount);

        let html = realProducts.map(p => this.createProductCard(p)).join('');
        if (placeholderCount > 0) {
            html += Array.from({ length: placeholderCount }, (_, i) =>
                this.createPlaceholderCard(realCount + i + 1)
            ).join('');
        }

        grid.innerHTML = html;
    },

    createProductCard(product) {
        const lang = Language.currentLang;
        // Build images: prefer images array, fallback to single image
        const allImages = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);
        let imagesHtml;
        if (allImages.length > 0) {
            const firstImgSrc = allImages[0].startsWith('http') ? allImages[0] : Utils.resolveImage('/images/' + allImages[0]);
            const imgCountBadge = allImages.length > 1 ? `<span class="card-img-count">${allImages.length} 张</span>` : '';
            const dotsHtml = allImages.length > 1 ? `<div class="card-dots">${allImages.map((_, i) => `<span class="card-dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>` : '';
            imagesHtml = `<div class="product-gallery">${imgCountBadge}<img src="${firstImgSrc}" alt="" loading="lazy">${dotsHtml}</div>`;
        } else {
            imagesHtml = `<img src="https://picsum.photos/400/400?random=${product.id || Math.random()}" alt="" loading="lazy">`;
        }
        const price = product.price
            ? (typeof product.price === 'number' ? '¥' + product.price.toLocaleString() : product.price)
            : Language.t('placeholder.price');
        // Support multilingual name/description (object with lang keys) or plain string
        const productName = (typeof product.name === 'object' && product.name !== null)
            ? (product.name[lang] || product.name['zh'] || product.name['en'] || Object.values(product.name)[0] || '')
            : (product.name || '');
        const productDesc = (typeof product.description === 'object' && product.description !== null)
            ? (product.description[lang] || product.description['zh'] || product.description['en'] || Object.values(product.description)[0] || '')
            : (product.description || '');
        // For cart, use the localized name
        product._displayName = productName;
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image" onclick="showProductDetail('${product.id}')">
                    ${imagesHtml}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${productName}</h3>
                    <p class="product-price">${price}</p>
                    <p class="product-description">${productDesc}</p>
                    <div class="product-actions">
                        <button class="btn btn-outline" onclick="event.stopPropagation(); showProductDetail('${product.id}')">
                            ${Language.t('products.viewDetail')}
                        </button>
                        <button class="btn btn-secondary" data-cart-id="${product.id}" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            ${Language.t('products.addToCart')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    createPlaceholderCard(slotNumber) {
        return `
            <div class="product-card placeholder" data-slot="${slotNumber}">
                <div class="product-image">
                    <div class="placeholder-bg">
                        <span class="placeholder-number">${slotNumber}</span>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${Language.t('placeholder.name', { n: slotNumber })}</h3>
                    <p class="product-price placeholder-price">${Language.t('placeholder.price')}</p>
                    <p class="product-description">${Language.t('placeholder.description')}</p>
                    <div class="product-actions">
                        <button class="btn btn-outline" disabled>${Language.t('products.viewDetail')}</button>
                        <button class="btn btn-secondary" disabled>${Language.t('placeholder.button')}</button>
                    </div>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const match = currentPath.match(/\/pages\/([^\/]+)\//);
    let brandSlug = match ? match[1] : 'atelier';
    // Slug alias mapping (e.g., gucci page uses woven data slot)
    const slugAliases = { 'gucci': 'woven' };
    brandSlug = slugAliases[brandSlug] || brandSlug;
    BrandPage.init(brandSlug);
});
