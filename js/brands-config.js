// Collection configuration for Qevora Studio
const BrandsConfig = {
  brands: [
    { slug: 'atelier', name: '原创手作系列', englishName: 'ATELIER ORIGINALS', description: 'Qevora Studio 的原创手工包系列，强调原创廓形、实用容量与可长期使用的质感。', products: [] },
    { slug: 'crossbody', name: 'Miu Miu 手工系列', englishName: 'MIU MIU HANDMADE', description: 'Miu Miu 手工精制系列，复古廓形与少女感元素碰撞，涵盖 Wander 手袋、保龄球包、托特包等经典包型。', products: [] },
    { slug: 'woven', name: 'Gucci 系列', englishName: 'GUCCI EDIT', description: '意大利经典奢华，Horsebit 1955、Marmont、Ophidia、Dionysus 等标志性包型。', products: [] },
    { slug: 'dior', name: 'Dior 系列', englishName: 'DIOR EDIT', description: '经典廓形与现代花漾元素结合的优雅系列。', products: [] },
    { slug: 'fendi', name: 'Fendi 系列', englishName: 'FENDI EDIT', description: '意大利经典奢华，Peekaboo/Baguette/First 等标志性包型。', products: [] },
    { slug: 'hermes', name: 'Hermès 系列', englishName: 'HERMÈS EDIT', description: '敬请期待', products: [] },
    { slug: 'bottega-veneta', name: 'Bottega Veneta 系列', englishName: 'BOTTEGA VENETA EDIT', description: '敬请期待', products: [] },
    { slug: 'balenciaga', name: 'Balenciaga 系列', englishName: 'BALENCIAGA EDIT', description: '敬请期待', products: [] },
    { slug: 'evening', name: '晚宴小包系列', englishName: 'EVENING EDIT', description: '敬请期待', products: [] },
    { slug: 'custom', name: '定制服务系列', englishName: 'CUSTOM SERVICE', description: '敬请期待', products: [] }
  ],
  getAllBrands() { return this.brands; },
  getBrandBySlug(slug) { return this.brands.find(b => b.slug === slug) || null; },
  getBrandName(slug) { const brand = this.getBrandBySlug(slug); return brand ? brand.name : slug; },
  getBrandOptions() { return this.brands.map(b => ({ value: b.slug, text: `${b.name} ${b.englishName}` })); },
  getBrandOptionsHTML() { return this.brands.map(b => `<option value="${b.slug}">${b.englishName}</option>`).join(''); },
  getBrandDescription(slug) { const brand = this.getBrandBySlug(slug); return brand ? brand.description : ''; }
};
