// Export all handlers for easy importing
const { healthHandler } = require("./health");
const { getWorkflowHandler, getWorkflowJsonHandler } = require("./workflow");
const { getConversationHandler } = require("./conversation");
const { getSignedUrlHandler } = require("./agent");

module.exports = {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
};
