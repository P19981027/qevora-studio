// 平滑滚动到品牌区域
function scrollToBrands() {
    const brandsSection = document.getElementById('brands');
    if (brandsSection) {
        brandsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 滚动效果 - 黑白灰配色
let lastScroll = 0;

window.addEventListener('scroll', function() {
    const nav = document.querySelector('.site-nav');
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.style.background = 'rgba(255, 255, 255, 0.98)';
        nav.style.boxShadow = '0 1px 0 rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 1)';
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// 滚动动画
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.brands-section, .quality-section, .contact-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'all 0.8s ease-out';
    observer.observe(section);
});

const heroEl = document.querySelector('.home-hero');
if (heroEl) {
    heroEl.style.opacity = '1';
    heroEl.style.transform = 'translateY(0)';
}

// WebP optimization: upgrade .jpg/.png images to .webp if browser supports it
(function() {
    const testImg = new Image();
    testImg.onload = function() {
        if (testImg.width > 0) upgradeToWebP();
    };
    testImg.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

    function upgradeToWebP() {
        document.querySelectorAll('img').forEach(img => {
            if (img.dataset.webpChecked) return;
            img.dataset.webpChecked = '1';
            const src = img.getAttribute('src');
            if (src && /\.(jpg|jpeg|png)$/i.test(src) && !src.startsWith('http') && !src.startsWith('data:')) {
                const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                const testEl = new Image();
                testEl.onload = function() { img.src = webpSrc; };
                testEl.onerror = function() { /* webp not available, keep original */ };
                testEl.src = webpSrc;
            }
        });
    }
})();
