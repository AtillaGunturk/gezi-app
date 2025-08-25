let currentScale = 1;

function showFullImage(path, aciklama) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  const caption = document.getElementById('modalCaption');

  img.src = path;
  caption.textContent = aciklama;
  currentScale = 1;
  img.style.transform = `scale(${currentScale})`;
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
}

// Zoom (pinch)
const imgEl = document.getElementById('modalImage');
let startDistance = 0;

imgEl.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    startDistance = getDistance(e.touches[0], e.touches[1]);
  }
}, false);

imgEl.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const newDistance = getDistance(e.touches[0], e.touches[1]);
    const scaleChange = newDistance / startDistance;
    currentScale = Math.min(Math.max(currentScale * scaleChange, 1), 5); // 1x - 5x
    imgEl.style.transform = `scale(${currentScale})`;
    startDistance = newDistance;
  }
}, false);

function getDistance(touch1, touch2) {
  const dx = touch2.pageX - touch1.pageX;
  const dy = touch2.pageY - touch1.pageY;
  return Math.sqrt(dx * dx + dy * dy);
      }
