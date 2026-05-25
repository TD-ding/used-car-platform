// 输入验证工具函数
function validateId(value, name = 'ID') {
  const id = parseInt(value);
  if (!Number.isInteger(id) || id <= 0) {
    return { valid: false, error: `无效的${name}` };
  }
  return { valid: true, value: id };
}

function validatePagination(page, limit, maxLimit = 100) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  return { page: p, limit: l, offset: (p - 1) * l };
}

function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

module.exports = { validateId, validatePagination, sanitizeString };
