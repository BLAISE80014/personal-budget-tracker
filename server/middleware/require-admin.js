export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Administrator access is required.' } })
  }
  next()
}
