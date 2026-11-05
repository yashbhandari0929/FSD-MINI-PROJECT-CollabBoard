/**
 * Canvas 2D Rendering Utilities with Theme & Image Support
 */

export const LIGHT_BG = '#ffffff';
export const DARK_BG = '#111217';

// In-memory cache for loaded HTMLImageElements
const imageCache = new Map();

/**
 * Redraws all elements onto the 2D canvas context
 */
export function redrawCanvas(ctx, elements, width, height, previewElement = null, isDarkMode = false) {
  if (!ctx) return;

  const currentBg = isDarkMode ? DARK_BG : LIGHT_BG;

  // Clear entire viewport with theme background
  ctx.save();
  ctx.fillStyle = currentBg;
  ctx.fillRect(0, 0, width, height);

  // Draw committed elements in chronological order
  if (Array.isArray(elements)) {
    for (const elem of elements) {
      drawElement(ctx, elem, false, currentBg);
    }
  }

  // Draw active preview if user is currently dragging/drawing
  if (previewElement) {
    drawElement(ctx, previewElement, true, currentBg);
  }

  ctx.restore();
}

/**
 * Draws a single element
 */
export function drawElement(ctx, elem, isPreview = false, currentBg = LIGHT_BG) {
  if (!elem || !elem.type) return;

  ctx.save();

  if (isPreview) {
    ctx.globalAlpha = 0.85;
  }

  ctx.strokeStyle = elem.color || '#4f46e5';
  ctx.fillStyle = elem.color || '#4f46e5';
  ctx.lineWidth = elem.size || 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (elem.type) {
    case 'stroke':
      drawStroke(ctx, elem.points);
      break;

    case 'eraser':
      ctx.strokeStyle = currentBg;
      ctx.lineWidth = (elem.size || 6) * 3;
      drawStroke(ctx, elem.points);
      break;

    case 'line':
      drawLine(ctx, elem.startX, elem.startY, elem.endX, elem.endY);
      break;

    case 'rectangle':
      drawRectangle(ctx, elem.startX, elem.startY, elem.endX, elem.endY);
      break;

    case 'circle':
      drawCircle(ctx, elem.startX, elem.startY, elem.endX, elem.endY);
      break;

    case 'text':
      drawText(ctx, elem.text, elem.x, elem.y, elem.fontSize || 20);
      break;

    case 'image':
      drawImage(ctx, elem);
      break;

    default:
      break;
  }

  // Draw subtle author attribution tag for collaborative drawing
  if (elem.userName && !isPreview && elem.type !== 'eraser') {
    drawAuthorTag(ctx, elem);
  }

  ctx.restore();
}

/**
 * Draws an author attribution tag indicating who drew the element
 */
function drawAuthorTag(ctx, elem) {
  if (!elem.userName) return;

  let px = null;
  let py = null;

  if (elem.points && elem.points.length > 0) {
    px = elem.points[0].x;
    py = elem.points[0].y;
  } else if (elem.startX !== undefined) {
    px = elem.startX;
    py = elem.startY;
  } else if (elem.x !== undefined) {
    px = elem.x;
    py = elem.y;
  }

  if (px === null || py === null) return;

  ctx.save();
  ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const label = elem.userName;
  const metrics = ctx.measureText(label);
  const tagW = metrics.width + 10;
  const tagH = 14;
  const tagX = Math.max(px, 2);
  const tagY = Math.max(py - tagH - 4, 2);

  // Background tag
  ctx.fillStyle = elem.color || '#4f46e5';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tagX, tagY, tagW, tagH, 3);
  } else {
    ctx.rect(tagX, tagY, tagW, tagH);
  }
  ctx.fill();

  // Name text
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1.0;
  ctx.fillText(label, tagX + 5, tagY + 10.5);
  ctx.restore();
}

/**
 * Freehand stroke
 */
function drawStroke(ctx, points) {
  if (!Array.isArray(points) || points.length === 0) return;

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

/**
 * Straight Line
 */
function drawLine(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

/**
 * Rectangle
 */
function drawRectangle(ctx, startX, startY, endX, endY) {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);

  ctx.beginPath();
  ctx.strokeRect(x, y, w, h);
}

/**
 * Circle or Ellipse
 */
function drawCircle(ctx, startX, startY, endX, endY) {
  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
}

/**
 * Text
 */
function drawText(ctx, text, x, y, fontSize) {
  if (!text) return;
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

/**
 * Image element drawing with automatic caching
 */
function drawImage(ctx, elem) {
  if (!elem.src) return;

  let img = imageCache.get(elem.src);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = elem.src;
    img.onload = () => {
      // Trigger canvas refresh when image finishes downloading
      if (ctx && ctx.canvas) {
        ctx.drawImage(img, elem.x, elem.y, elem.width, elem.height);
      }
    };
    imageCache.set(elem.src, img);
  }

  if (img.complete && img.naturalWidth !== 0) {
    ctx.drawImage(img, elem.x, elem.y, elem.width, elem.height);
  }
}

/**
 * Get pointer coordinates
 */
export function getCanvasCoordinates(event, canvas) {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();

  const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX) ?? 0;
  const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY) ?? 0;

  return {
    x: Math.round(clientX - rect.left),
    y: Math.round(clientY - rect.top)
  };
}
