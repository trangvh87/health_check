const healthCheckUrls = (process.env.HEALTH_CHECK_URLS || '')
  .split(',')
  .filter((url) => url.trim());

module.exports = async (req, res) => {
  return res.status(200).json({
    status: 'running',
    urlCount: healthCheckUrls.length,
    lastCheck: new Date().toISOString()
  });
};
