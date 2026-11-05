/**
 * Input validation and sanitization utilities
 */

const VALID_ELEMENT_TYPES = new Set(['stroke', 'line', 'rectangle', 'circle', 'text', 'eraser', 'image']);

/**
 * Validates and sanitizes a room ID.
 * Returns null if invalid, or trimmed valid string.
 */
export function validateRoomId(roomId) {
  if (typeof roomId !== 'string') return null;
  const trimmed = roomId.trim();
  // Allow letters, numbers, hyphens, underscores, 3-64 chars
  const regex = /^[a-zA-Z0-9_-]{3,64}$/;
  return regex.test(trimmed) ? trimmed : null;
}

/**
 * Validates and sanitizes a user display name.
 */
export function sanitizeUserName(name) {
  if (typeof name !== 'string') return 'Collaborator';
  const cleaned = name.trim().replace(/<[^>]*>/g, '').slice(0, 32);
  return cleaned.length > 0 ? cleaned : 'Collaborator';
}

/**
 * Validates a single drawing element payload.
 * Returns true if element structure is valid, false otherwise.
 */
export function validateElement(elem) {
  if (!elem || typeof elem !== 'object') return false;
  if (typeof elem.id !== 'string' || elem.id.length === 0 || elem.id.length > 100) return false;
  if (!VALID_ELEMENT_TYPES.has(elem.type)) return false;

  // Validate brush size
  if (typeof elem.size !== 'number' || elem.size < 1 || elem.size > 100) {
    elem.size = 3;
  }

  // Validate color (hex or rgba)
  if (typeof elem.color !== 'string' || elem.color.length > 30) {
    elem.color = '#1e1b4b';
  }

  // Type-specific validations
  if (elem.type === 'stroke' || elem.type === 'eraser') {
    if (!Array.isArray(elem.points) || elem.points.length === 0) return false;
    // Cap points to 10,000 to prevent payload bombing
    if (elem.points.length > 10000) elem.points = elem.points.slice(0, 10000);
    for (const pt of elem.points) {
      if (typeof pt.x !== 'number' || typeof pt.y !== 'number' || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) {
        return false;
      }
    }
  } else if (elem.type === 'line' || elem.type === 'rectangle' || elem.type === 'circle') {
    if (
      typeof elem.startX !== 'number' ||
      typeof elem.startY !== 'number' ||
      typeof elem.endX !== 'number' ||
      typeof elem.endY !== 'number' ||
      !Number.isFinite(elem.startX) ||
      !Number.isFinite(elem.startY) ||
      !Number.isFinite(elem.endX) ||
      !Number.isFinite(elem.endY)
    ) {
      return false;
    }
  } else if (elem.type === 'text') {
    if (typeof elem.text !== 'string' || elem.text.length > 1000) return false;
    if (typeof elem.x !== 'number' || typeof elem.y !== 'number' || !Number.isFinite(elem.x) || !Number.isFinite(elem.y)) {
      return false;
    }
    // Basic text sanitization
    elem.text = elem.text.slice(0, 1000);
  } else if (elem.type === 'image') {
    if (typeof elem.src !== 'string' || elem.src.length === 0) return false;
    if (typeof elem.x !== 'number' || typeof elem.y !== 'number' || typeof elem.width !== 'number' || typeof elem.height !== 'number') {
      return false;
    }
  }

  return true;
}
