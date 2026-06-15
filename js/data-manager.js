const DataManager = {
  DATA_FILE: 'data/products.json',

  /** Get localized product name from a product object */
  getLocalizedName(product, lang) {
    if (typeof product.name === 'object' && product.name !== null) {
      return product.name[lang] || product.name['zh'] || product.name['en'] || Object.values(product.name)[0] || '';
    }
    return product.name || '';
  },

  /** Get localized product description from a product object */
  getLocalizedDesc(product, lang) {
    if (typeof product.description === 'object' && product.description !== null) {
      return product.description[lang] || product.description['zh'] || product.description['en'] || Object.values(product.description)[0] || '';
    }
    return product.description || '';
  },

  getAllProducts() {
    try {
      const data = localStorage.getItem(this.DATA_FILE);
      if (!data) {
        // Auto-initialize brand structure if no data exists
        return this.ensureBrandStructure();
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load product data:', error);
      return this.ensureBrandStructure();
    }
  },

  /** Sync products.json into localStorage (works when served via HTTP) */
  async syncFromFile() {
    try {
      const resp = await fetch(this.DATA_FILE);
      if (resp.ok) {
        const json = await resp.json();
        this.saveAllProducts(json);
        return true;
      }
    } catch (e) {
      // file:// protocol or network error, ignore
    }
    return false;
  },

  ensureBrandStructure() {
    const brands = ['atelier', 'crossbody', 'woven', 'dior', 'fendi', 'hermes', 'bottega-veneta', 'balenciaga', 'evening', 'custom'];
    const brandNames = { atelier: '原创手作系列', crossbody: 'Miu Miu 手工系列', woven: 'Gucci 系列', dior: 'Dior 系列', fendi: 'Fendi 系列', hermes: 'Hermès 系列', 'bottega-veneta': 'Bottega Veneta 系列', balenciaga: 'Balenciaga 系列', evening: '晚宴小包系列', custom: '定制服务系列' };
    const brandEnglish = { atelier: 'ATELIER ORIGINALS', crossbody: 'MIU MIU HANDMADE', woven: 'GUCCI EDIT', dior: 'DIOR EDIT', fendi: 'FENDI EDIT', hermes: 'HERMÈS EDIT', 'bottega-veneta': 'BOTTEGA VENETA EDIT', balenciaga: 'BALENCIAGA EDIT', evening: 'EVENING EDIT', custom: 'CUSTOM SERVICE' };
    const structure = {};
    brands.forEach(slug => {
      structure[slug] = { name: brandNames[slug], brand: brandEnglish[slug], slug, products: [] };
    });
    this.saveAllProducts(structure);
    return structure;
  },

  getBrandProducts(brandSlug) {
    const allProducts = this.getAllProducts();
    if (!allProducts) return null;
    return allProducts[brandSlug] || { name: '', brand: '', slug: brandSlug, products: [] };
  },

  addProduct(brandSlug, productData) {
    let allProducts = this.getAllProducts();
    if (!allProducts) return { success: false, message: 'Data load failed' };
    if (!allProducts[brandSlug]) {
      // Auto-create brand entry if missing
      allProducts[brandSlug] = { name: brandSlug, brand: brandSlug.toUpperCase(), slug: brandSlug, products: [] };
    }

    const productId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newProduct = {
      id: productId,
      name: productData.name,
      price: productData.price,
      image: productData.image,
      description: productData.description,
      specs: productData.specs,
      color: productData.color,
      size: productData.size,
      category: productData.category,
      featured: productData.featured || false,
      createdAt: new Date().toISOString()
    };

    allProducts[brandSlug].products.push(newProduct);
    this.saveAllProducts(allProducts);
    return { success: true, message: 'Product added', product: newProduct };
  },

  deleteProduct(brandSlug, productId) {
    const allProducts = this.getAllProducts();
    if (!allProducts) return { success: false, message: 'Data load failed' };
    if (!allProducts[brandSlug]) return { success: false, message: 'Brand not found' };

    const productIndex = allProducts[brandSlug].products.findIndex(p => p.id === productId);
    if (productIndex === -1) return { success: false, message: 'Product not found' };

    allProducts[brandSlug].products.splice(productIndex, 1);
    this.saveAllProducts(allProducts);
    return { success: true, message: 'Product deleted' };
  },

  updateProduct(brandSlug, productId, productData) {
    const allProducts = this.getAllProducts();
    if (!allProducts) return { success: false, message: 'Data load failed' };
    if (!allProducts[brandSlug]) return { success: false, message: 'Brand not found' };

    const productIndex = allProducts[brandSlug].products.findIndex(p => p.id === productId);
    if (productIndex === -1) return { success: false, message: 'Product not found' };

    allProducts[brandSlug].products[productIndex] = {
      ...allProducts[brandSlug].products[productIndex],
      ...productData,
      id: productId,
      updatedAt: new Date().toISOString()
    };

    this.saveAllProducts(allProducts);
    return { success: true, message: 'Product updated', product: allProducts[brandSlug].products[productIndex] };
  },

  saveAllProducts(data) {
    try {
      localStorage.setItem(this.DATA_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save product data:', error);
      return false;
    }
  },

  exportData() {
    const data = this.getAllProducts();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qevora-studio-products-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      this.saveAllProducts(data);
      return { success: true, message: 'Data imported' };
    } catch (error) {
      return { success: false, message: 'Invalid data format' };
    }
  },

  migrateData() {
    const allProducts = this.getAllProducts();
    if (!allProducts) return;
    let migrated = false;
    for (const brand in allProducts) {
      if (allProducts[brand].products) {
        allProducts[brand].products.forEach(p => {
          if (p.category === undefined) {
            p.category = 'classic';
            migrated = true;
          }
        });
      }
    }
    if (migrated) this.saveAllProducts(allProducts);
  }
};
