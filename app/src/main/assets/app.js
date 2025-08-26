let currentScale = 1;

const modal   = document.getElementById('imageModal');
const imgEl   = document.getElementById('modalImage');
const caption = document.getElementById('modalCaption');

function normalizePath(p) {
  if (!p) return '';
  if (p.startsWith('http') || p.startsWith('content://') || p.startsWith('file://')) return p;
  if (p.startsWith('/')) return 'file://' + p; // Android yerel dosya yolu desteği
  return p;
}

window.showFullImage = function (path, aciklama) {
  const src = normalizePath(path);
  imgEl.src = src;
  caption.textContent = aciklama || '';
  currentScale = 1;
  imgEl.style.transform = `scale(${currentScale})`;
  modal.style.display = 'block';
};

window.closeModal = function () {
  modal.style.display = 'none';
  imgEl.src = '';
};

// Arka plana tıklayınca kapat
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Pinch-to-zoom
let startDistance = 0;

imgEl.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    startDistance = getDistance(e.touches[0], e.touches[1]);
  }
}, false);

imgEl.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    const newDistance = getDistance(e.touches[0], e.touches[1]);
    const scaleChange = newDistance / startDistance;
    currentScale = Math.min(Math.max(currentScale * scaleChange, 1), 5); // 1x - 5x
    imgEl.style.transform = `scale(${currentScale})`;
    startDistance = newDistance;
  }
}, false);

function getDistance(t1, t2) {
  const dx = t2.pageX - t1.pageX;
  const dy = t2.pageY - t1.pageY;
  return Math.sqrt(dx * dx + dy * dy);
  }
