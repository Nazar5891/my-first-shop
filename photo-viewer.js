(() => {
  const selector = 'img[src^="data:image/webp"], img[src^="data:image/jpeg"], img[src^="data:image/jpg"]';

  const openViewer = (img) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;touch-action:none;';

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Закрити фото');
    closeButton.style.cssText = 'position:absolute;right:14px;top:14px;width:48px;height:48px;border:0;border-radius:50%;background:rgba(15,23,42,.9);color:#fff;font-size:38px;line-height:42px;z-index:2;cursor:pointer;';
    closeButton.onclick = close;

    const full = document.createElement('img');
    full.src = img.currentSrc || img.src;
    full.alt = img.alt || 'Фото оголошення';
    full.style.cssText = 'display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;';

    overlay.appendChild(full);
    overlay.appendChild(closeButton);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  };

  const enhance = () => {
    document.querySelectorAll(selector).forEach((img) => {
      if (img.dataset.photoViewerReady === '1') return;

      // Only alter the published listing photo card, not unrelated site images.
      const parent = img.parentElement;
      if (!parent || !parent.className || !String(parent.className).includes('max-h-52')) return;

      img.dataset.photoViewerReady = '1';
      img.style.objectFit = 'contain';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.maxHeight = 'none';
      img.style.display = 'block';
      img.style.cursor = 'zoom-in';
      parent.style.maxHeight = 'none';
      parent.style.height = 'auto';
      parent.style.overflow = 'hidden';
      parent.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openViewer(img); });
    });
  };

  enhance();
  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
})();
