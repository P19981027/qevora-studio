const CountrySelector = {
  selected: { code: '', name: '', phone: '', hint: '' },

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  },

  /** 重新渲染（语言切换时调用） */
  render() {
    const list = I18n.getCountryList();
    this.container.innerHTML = `
      <div class="country-select-row">
        <select id="addrCountry" class="addr-select addr-country" onchange="CountrySelector.onChange(this)">
          <option value="">${I18n.t('country.select')}</option>
          ${list.map(c => `<option value="${c.code}" data-phone="${c.phone}" data-hint="${c.hint}">${c.name}</option>`).join('')}
        </select>
      </div>
    `;
    // 如果之前有选中的国家，恢复选择
    if (this.selected.code) {
      const sel = document.getElementById('addrCountry');
      if (sel) sel.value = this.selected.code;
    }
  },

  /** I18n 语言切换回调 */
  _onLangChange() {
    this.render();
    // 语言切换后更新 hint 显示
    const hintEl = document.getElementById('addrFormatHint');
    if (this.selected.code && hintEl) {
      const sel = document.getElementById('addrCountry');
      if (sel) {
        const opt = sel.options[sel.selectedIndex];
        const hint = opt ? opt.getAttribute('data-hint') : '';
        this.selected.hint = hint;
        hintEl.textContent = I18n.t('hint.prefix') + ': ' + hint;
        hintEl.classList.add('show');
      }
    }
  },

  onChange(el) {
    const option = el.options[el.selectedIndex];
    const hintEl = document.getElementById('addrFormatHint');
    this.selected.code = el.value;
    this.selected.name = option ? option.text : '';
    this.selected.phone = el.value ? option.getAttribute('data-phone') : '';

    if (el.value) {
      const hint = option.getAttribute('data-hint');
      this.selected.hint = hint;
      hintEl.textContent = I18n.t('hint.prefix') + ': ' + hint;
      hintEl.classList.add('show');
    } else {
      this.selected.hint = '';
      hintEl.classList.remove('show');
    }
  },

  getSelected() {
    return { ...this.selected };
  },

  validate() {
    if (!this.selected.code) return I18n.t('err.country');
    return null;
  }
};
