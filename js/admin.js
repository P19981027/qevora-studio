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
                throw new Error(err.error || '上传失败');
            }
            
            const result = await resp.json();
            const imageUrl = window.location.origin + result.url;
            
            document.getElementById('brandBgImageUrl').value = imageUrl;
            this.updateBrandBgPreview(imageUrl);
            
            if (preview) preview.style.opacity = '1';
        } catch (err) {
            alert('图片上传失败: ' + err.message);
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
