/**
 * Health check endpoint handler
 */
const healthHandler = (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "todo-api-server",
  });
};

module.exports = { healthHandler };
