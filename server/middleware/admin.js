function adminMiddleware(req, res, next) {
  if (!req.member || req.member.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
}

module.exports = adminMiddleware;
