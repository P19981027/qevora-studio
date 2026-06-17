/**
 * ImageViewer - Lightweight fullscreen image zoom viewer
 * USAGE:
 *   ImageViewer.open(images, startIndex)
 *     images: Array of image URL strings
 *     startIndex: starting index (default 0)
 *   ImageViewer.close()
 */
var ImageViewer = (function () {
  'use strict';

  var overlay = null;
  var img = null;
  var closeBtn = null;
  var prevBtn = null;
  var nextBtn = null;
  var counter = null;

  var images = [];
  var currentIndex = 0;
  var isOpen = false;

  function create() {
    if (overlay) return;

    // Overlay
    overlay = document.createElement('div');
    overlay.className = 'iv-overlay';

    // Close button
    closeBtn = document.createElement('button');
    closeBtn.className = 'iv-close';
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close');
    overlay.appendChild(closeBtn);

    // Previous arrow
    prevBtn = document.createElement('button');
    prevBtn.className = 'iv-arrow iv-arrow-prev';
    prevBtn.innerHTML = '&#10094;';
    prevBtn.setAttribute('aria-label', 'Previous');
    overlay.appendChild(prevBtn);

    // Next arrow
    nextBtn = document.createElement('button');
    nextBtn.className = 'iv-arrow iv-arrow-next';
    nextBtn.innerHTML = '&#10095;';
    nextBtn.setAttribute('aria-label', 'Next');
    overlay.appendChild(nextBtn);

    // Image
    img = document.createElement('img');
    img.className = 'iv-image';
    img.alt = '';
    overlay.appendChild(img);

    // Counter
    counter = document.createElement('div');
    counter.className = 'iv-counter';
    overlay.appendChild(counter);

    // Events
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); navigate(-1); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); navigate(1); });

    document.body.appendChild(overlay);
  }

  function onKeydown(e) {
    if (!isOpen) return;
    switch (e.key) {
      case 'Escape':
        close();
        break;
      case 'ArrowLeft':
        navigate(-1);
        break;
      case 'ArrowRight':
        navigate(1);
        break;
    }
  }

  function navigate(delta) {
    if (images.length <= 1) return;
    currentIndex = (currentIndex + delta + images.length) % images.length;
    showImage();
  }

  function showImage() {
    if (!img || !counter) return;
    img.classList.remove('iv-image-visible');
    setTimeout(function () {
      img.src = images[currentIndex];
      img.classList.add('iv-image-visible');
    }, 80);

    counter.textContent = (currentIndex + 1) + ' / ' + images.length;
    counter.style.display = images.length > 1 ? 'block' : 'none';
    prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
  }

  function open(imageList, startIndex) {
    if (!imageList || imageList.length === 0) return;

    images = imageList.filter(function (url) { return url && url.trim(); });
    if (images.length === 0) return;

    currentIndex = Math.max(0, Math.min(startIndex || 0, images.length - 1));

    create();
    showImage();

    overlay.classList.add('iv-overlay-visible');
    document.body.style.overflow = 'hidden';
    isOpen = true;

    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (!overlay || !isOpen) return;
    overlay.classList.remove('iv-overlay-visible');
    document.body.style.overflow = '';
    isOpen = false;
    document.removeEventListener('keydown', onKeydown);
  }

  return {
    open: open,
    close: close
  };
})();
