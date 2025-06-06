import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

// Import handlers
import {
  healthHandler,
  getWorkflowHandler,
  getWorkflowSimpleHandler,
  getConversationHandler,
  getSignedUrlHandler,
} from "./handlers/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Log env vars on startup
console.log("Environment variables loaded:");
console.log("- PORT:", process.env.PORT);
console.log(
  "- QUIZ_PASSCODE:",
  process.env.QUIZ_PASSCODE ? "[SET]" : "[NOT SET]"
);
console.log("- LOG_LEVEL:", process.env.LOG_LEVEL);
console.log("- CORS_ORIGIN:", process.env.CORS_ORIGIN);

// Health check endpoint
app.get("/health", healthHandler);

// Get workflow endpoint with authentication
app.post("/api/workflow", getWorkflowHandler);

app.get("/api/workflow.json", getWorkflowSimpleHandler);

// Get conversation endpoint
app.get("/api/conversation/:conversationId", getConversationHandler);

// Get signed URL for workflow step endpoint
app.post("/api/workflow/agent", getSignedUrlHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Todo API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Workflow endpoint: http://localhost:${PORT}/api/workflow`);
  console.log(
    `📋 Workflow JSON endpoint: http://localhost:${PORT}/api/workflow.json`
  );
  console.log(
    `🔐 Signed URL endpoint: http://localhost:${PORT}/api/workflow/agent`
  );
  console.log(
    `💬 Conversation endpoint: http://localhost:${PORT}/api/conversation`
  );
});

export default app;
