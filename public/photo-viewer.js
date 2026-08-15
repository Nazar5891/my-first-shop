(() => {
  let overlay = null;

  const closeViewer = () => {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = '';
  };

  const openViewer = (src, alt = '') => {
    closeViewer();

    overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999', 'display:flex',
      'align-items:center', 'justify-content:center', 'padding:16px',
      'background:rgba(0,0,0,.94)', 'touch-action:none'
    ].join(';');

    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрити фото');
    close.innerHTML = '×';
    close.style.cssText = [
      'position:absolute', 'right:14px', 'top:12px', 'z-index:2',
      'width:48px', 'height:48px', 'border:0', 'border-radius:50%',
      'background:rgba(20,20,30,.85)', 'color:#fff', 'font-size:38px',
      'line-height:44px', 'cursor:pointer', 'box-shadow:0 4px 20px rgba(0,0,0,.4)'
    ].join(';');

    const image = document.createElement('img');
    image.src = src;
    image.alt = alt || 'Фото';
    image.style.cssText = [
      'display:block', 'max-width:100%', 'max-height:100%',
      'width:auto', 'height:auto', 'object-fit:contain',
      'border-radius:10px', 'user-select:none', '-webkit-user-drag:none'
    ].join(';');

    close.addEventListener('click', (event) => {
      event.stopPropagation();
      closeViewer();
    });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeViewer();
    });

    overlay.appendChild(image);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('img') : null;
    if (!target) return;
    const src = target.getAttribute('src') || '';
    const isListingPhoto = target.getAttribute('alt') === 'Фото товару' || src.startsWith('data:image/webp');
    if (!isListingPhoto) return;
    event.preventDefault();
    event.stopPropagation();
    openViewer(src, target.getAttribute('alt') || 'Фото товару');
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeViewer();
  });
})();
