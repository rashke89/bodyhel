const AuditLog = require('../models/AuditLog');

// Audit logging middleware
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.json;
    const originalStatus = res.status;

    let responseStatus = 200;
    let responseBody = null;

    // Intercept response
    res.status = function(code) {
      responseStatus = code;
      return originalStatus.apply(this, arguments);
    };

    res.json = function(body) {
      responseBody = body;
      return originalSend.apply(this, arguments);
    };

    // Continue to next middleware
    next();

    // Log after response
    res.on('finish', async () => {
      try {
        const logData = {
          user: req.user?._id || null,
          action: action || req.method,
          resource: resource || req.path.split('/')[2] || 'unknown',
          resourceId: req.params.id || null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          method: req.method,
          endpoint: req.path,
          requestBody: req.method !== 'GET' ? sanitizeRequestBody(req.body) : null,
          responseStatus: responseStatus,
          organization: req.user?.organization || null,
        };

        // Log changes for update/delete operations
        if (['PUT', 'PATCH', 'DELETE'].includes(req.method) && req.originalData) {
          logData.changes = {
            before: req.originalData,
            after: responseBody?.data || req.body
          };
        }

        await AuditLog.create(logData);
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't fail request if audit logging fails
      }
    });
  };
};

// Helper to sanitize request body (remove passwords, etc.)
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

module.exports = auditLog;