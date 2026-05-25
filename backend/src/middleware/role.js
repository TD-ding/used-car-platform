function role(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未登录' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足，无法访问' });
    }
    next();
  };
}

module.exports = role;
