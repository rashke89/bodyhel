import apiApp from '../../server/apiApp';

export default function handler(req, res) {
  // Ensure routes work under /api
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace('/api', '');
  }
  return apiApp(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
