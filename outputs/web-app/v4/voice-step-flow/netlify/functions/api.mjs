import express, { Router } from "express";
import serverless from "serverless-http";
import cors from "cors";

import {
  healthHandler,
  getWorkflowHandler,
  getWorkflowSimpleHandler,
  getConversationHandler,
  getSignedUrlHandler,
} from "../../api-server/src/handlers/index.js";

const api = express();

// Middleware - with explicit body parsing configuration
api.use(cors());
api.use(
  express.json({
    limit: "10mb",
    type: ["application/json", "text/plain"],
  })
);
api.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// Add body parsing debugging middleware
api.use((req, res, next) => {
  // Handle Buffer body in serverless environment
  if (req.body && req.body.type === "Buffer" && req.body.data) {
    try {
      const bodyString = Buffer.from(req.body.data).toString("utf8");
      req.body = JSON.parse(bodyString);
      console.log("✅ Successfully parsed Buffer body:", req.body);
    } catch (e) {
      console.error("❌ Failed to parse Buffer body:", e);
    }
  }

  console.log("📡 Request received:", {
    method: req.method,
    path: req.path,
    contentType: req.headers["content-type"],
    bodyType: typeof req.body,
    body: req.body,
  });
  next();
});

const router = Router();

// API routes using the same handlers as server.js
router.get("/hello", (req, res) => res.send("Hello World!"));

router.get("/health", healthHandler);

router.get("/conversation/:conversationId", getConversationHandler);

router.post("/workflow", getWorkflowHandler);
router.get("/workflow.json", getWorkflowSimpleHandler);

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
// api.listen(PORT, () => {
//   console.log(`🚀 KidBookBuilder API Server running`);
// });

export const handler = serverless(api, {
  binary: false,
  request: (request, event, context) => {
    // Ensure body parsing for serverless
    if (event.body && typeof event.body === "string") {
      try {
        request.body = JSON.parse(event.body);
      } catch (e) {
        console.warn("Failed to parse JSON body:", e);
      }
    }
  },
});
