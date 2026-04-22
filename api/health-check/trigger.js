const { runHealthCheck } = require('../../checker');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await runHealthCheck();
    return res.status(200).json({ message: 'Health check triggered successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
