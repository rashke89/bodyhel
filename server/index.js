const express = require('express');
require('dotenv').config();

const apiApp = require('./apiApp');

// Initialize Express app (local dev)
const app = express();

const PORT = process.env.PORT || 3001;

// Mount API app under /api for local dev
app.use('/api', apiApp);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 BodyHel API Server running on port ${PORT}`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = { app };
