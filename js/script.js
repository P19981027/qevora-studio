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
