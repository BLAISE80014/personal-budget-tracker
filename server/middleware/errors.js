export function notFound(req, res) {
  res.status(404).json({ success: false, error: { message: `Route not found: ${req.method} ${req.originalUrl}` } })
}

export function errorHandler(error, req, res, _next) {
  void _next
  if (res.headersSent) return

  const isSavingsRequest = req.resource === 'savings'
  if (isSavingsRequest) console.error('Savings API request failed:', error)

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: { message: isSavingsRequest ? error.message : 'The request contains invalid data.' },
    })
  }
  if (error.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
    return res.status(409).json({ success: false, error: { message: 'An account with that email already exists.' } })
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, error: { message: 'A record with these details already exists.' } })
  }

  const status = Number(error.statusCode) || 500
  if (status >= 500 && !isSavingsRequest) console.error(error)
  res.status(status).json({
    success: false,
    error: { message: status >= 500 && !isSavingsRequest ? 'An unexpected server error occurred.' : error.message },
  })
}
