import express, { Router } from "express";
import serverless from "serverless-http";

// Import handlers
import {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
} from "../handlers-esm.js";

const api = express();

// Middleware
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

const router = Router();

// API routes using the same handlers as server.js
router.get("/hello", (req, res) => res.send("Hello World!"));

router.get("/health", healthHandler);

router.get("/conversation/:conversationId?", getConversationHandler);

router.post("/workflow", getWorkflowHandler);
router.post("/workflow/agent", getSignedUrlHandler);

api.use("/api/", router);

// Error handling middleware
api.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
api.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Start server
api.listen(PORT, () => {
  console.log(`🚀 KidBookBuilder API Server running on port ${PORT}`);
});

export const handler = serverless(api);
