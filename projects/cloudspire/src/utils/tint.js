function tintSprite(img, color) {
  if (!img) return null;
  let canvas = null;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
  } else {
    const wxApi = typeof wx !== 'undefined' ? wx : null;
    if (wxApi) {
      if (wxApi.createOffscreenCanvas) canvas = wxApi.createOffscreenCanvas({ type: '2d' });
      else if (wxApi.createCanvas) canvas = wxApi.createCanvas();
    }
  }
  if (!canvas) return null;
  canvas.width = img.width || 64;
  canvas.height = img.height || 72;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = color || 'rgba(255,60,60,0.9)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

module.exports = { tintSprite };
