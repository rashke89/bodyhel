const apiApp = require('../../server/apiApp');

module.exports = (req, res) => {
  // Ensure routes work under /api
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace('/api', '');
  }
  return apiApp(req, res);
};
