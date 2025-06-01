// ES module wrapper for handlers
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Import CommonJS handlers
const {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
} = require(path.join(__dirname, "../src/handlers/index.js"));

export {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
};
