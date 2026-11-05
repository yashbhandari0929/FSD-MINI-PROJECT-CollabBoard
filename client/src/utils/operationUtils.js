/**
 * Helper utilities for drawing operations and canvas export
 */

/**
 * Generates a unique, collison-free ID for drawing operations
 */
export function generateOperationId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `elem_${timestamp}_${randomPart}`;
}

/**
 * Throttle helper to limit frequency of rapid events (e.g. cursor moves)
 */
export function throttle(func, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Export canvas drawing as downloadable PNG image
 */
export function exportCanvasAsImage(canvas, fileName = 'collabboard-export.png') {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
