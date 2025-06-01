/**
 * Health check endpoint handler
 */
export const healthHandler = (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "todo-api-server",
  });
};
