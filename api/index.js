module.exports = async (req, res) => {
  res.status(200).json({
    message: 'Health check API is running',
    triggerEndpoint: '/api/health-check/trigger',
    statusEndpoint: '/api/health-check/status'
  });
};
