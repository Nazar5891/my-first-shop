(() => {
  const selector = 'img[src^="data:image/"]';

  const openViewer = (img) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.96);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;';
    const close = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    const closeButton = document.createElement('button');
    closeButton.type = 'button'; closeButton.textContent = '×'; closeButton.setAttribute('aria-label','Закрити фото');
    closeButton.style.cssText = 'position:absolute;right:14px;top:14px;width:48px;height:48px;border:0;border-radius:50%;background:rgba(15,23,42,.92);color:#fff;font-size:38px;line-height:42px;z-index:2;cursor:pointer;';
    closeButton.onclick = close;
    const full = document.createElement('img');
    full.src = img.currentSrc || img.src; full.alt = img.alt || 'Фото оголошення';
    full.style.cssText = 'display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;';
    overlay.appendChild(full); overlay.appendChild(closeButton); document.body.appendChild(overlay);
    const esc = e => { if(e.key === 'Escape'){ close(); document.removeEventListener('keydown',esc); } };
    document.addEventListener('keydown',esc);
  };

  const enhance = () => {
    document.querySelectorAll(selector).forEach(img => {
      if (img.dataset.photoViewerReady === '1') return;
      const parent = img.parentElement;
      if (!parent) return;
      const isListingPhoto = String(parent.className || '').includes('max-h-52') || img.closest('.animate-slide-in-right');
      if (!isListingPhoto) return;
      img.dataset.photoViewerReady = '1';
      img.classList.remove('object-cover','h-full');
      img.style.setProperty('object-fit','contain','important');
      img.style.setProperty('width','100%','important');
      img.style.setProperty('height','auto','important');
      img.style.setProperty('max-height','70vh','important');
      img.style.setProperty('display','block','important');
      img.style.cursor = 'zoom-in';
      parent.classList.remove('max-h-52','h-full');
      parent.style.setProperty('height','auto','important');
      parent.style.setProperty('max-height','70vh','important');
      parent.style.setProperty('overflow','hidden','important');
      parent.style.setProperty('display','flex','important');
      parent.style.setProperty('align-items','center','important');
      parent.style.setProperty('justify-content','center','important');
      parent.style.cursor = 'zoom-in';
      img.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openViewer(img); });
    });
  };
  enhance();
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
})();
