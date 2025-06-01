// ES module wrapper for handlers
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Try multiple possible paths for the handlers
let handlersPath;
try {
  // First try the relative path from netlify folder
  handlersPath = path.resolve(__dirname, "../src/handlers/index.js");
} catch (error) {
  // Fallback for Netlify deployment structure
  handlersPath = path.resolve(process.cwd(), "src/handlers/index.js");
}

console.log("Attempting to load handlers from:", handlersPath);

// Import CommonJS handlers
const {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
} = require(handlersPath);

export {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
};
