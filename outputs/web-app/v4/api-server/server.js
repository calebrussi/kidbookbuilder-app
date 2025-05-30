const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
require("dotenv").config();

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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "todo-api-server",
  });
});

// Get workflow endpoint
app.get("/api/workflow.json", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const workflowPath = path.join(__dirname, "data/workflow.json");

  // Add an 8-second delay
  setTimeout(() => {
    fs.readFile(workflowPath, "utf8", (err, data) => {
      if (err) {
        console.error("❌ Failed to read workflow.json:", err);
        return res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "Unable to load workflow.json file",
        });
      }
      try {
        const workflow = JSON.parse(data);
        res.json(workflow);
      } catch (parseErr) {
        console.error("❌ Failed to parse workflow.json:", parseErr);
        res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "workflow.json is not valid JSON",
        });
      }
    });
  }, 3000); // 1000 milliseconds = 1 seconds
});

// Get conversation endpoint
app.get("/api/conversation/:conversationId?", async (req, res) => {
  const { conversationId } = req.params;
  console.log(
    `💬 GET /api/conversation/${
      conversationId || "latest"
    } - Fetching conversation data`
  );

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message: "conversationId is required",
    });
  }

  try {
    // Make API call to ElevenLabs
    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!elevenLabsApiKey) {
      console.error(
        "❌ ELEVEN_LABS_API_KEY not found in environment variables"
      );
      return res.status(500).json({
        success: false,
        error: "Configuration Error",
        message: "ElevenLabs API key not configured",
      });
    }

    console.log(
      `🔗 Making request to ElevenLabs API for conversation: ${conversationId}`
    );

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": elevenLabsApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!elevenLabsResponse.ok) {
      console.error(
        `❌ ElevenLabs API error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText}`
      );

      if (elevenLabsResponse.status === 404) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: `Conversation with ID ${conversationId} not found`,
        });
      }

      if (elevenLabsResponse.status === 401) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Invalid ElevenLabs API key",
        });
      }

      return res.status(502).json({
        success: false,
        error: "External API Error",
        message: `ElevenLabs API returned ${elevenLabsResponse.status}`,
      });
    }

    const elevenLabsData = await elevenLabsResponse.json();
    console.log(`✅ Successfully retrieved conversation data from ElevenLabs`);

    // Transform ElevenLabs response to match our API format
    const transformedData = {
      conversationId: elevenLabsData.conversation_id,
      agentId: elevenLabsData.agent_id,
      status: elevenLabsData.status,
      startTime: elevenLabsData.metadata?.start_time_unix_secs
        ? new Date(
            elevenLabsData.metadata.start_time_unix_secs * 1000
          ).toISOString()
        : null,
      endTime:
        elevenLabsData.status === "done" || elevenLabsData.status === "failed"
          ? new Date().toISOString()
          : null,
      transcript: elevenLabsData.transcript || [],
      metadata: {
        totalMessages: elevenLabsData.transcript?.length || 0,
        duration: elevenLabsData.metadata?.call_duration_secs
          ? elevenLabsData.metadata.call_duration_secs * 1000
          : null,
        lastActivity: new Date().toISOString(),
        hasAudio: elevenLabsData.has_audio || false,
        hasUserAudio: elevenLabsData.has_user_audio || false,
        hasResponseAudio: elevenLabsData.has_response_audio || false,
      },
      analysis: elevenLabsData.analysis || null,
      conversationInitiationClientData:
        elevenLabsData.conversation_initiation_client_data || null,
    };

    res.json({
      success: true,
      data: transformedData,
      message: "Conversation retrieved successfully from ElevenLabs",
    });
  } catch (error) {
    console.error("❌ Error fetching conversation from ElevenLabs:", error);

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch conversation data",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get signed URL for workflow step endpoint
app.post("/api/workflow/agent", async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const { agentId } = req.body;

  console.log(`🔐 [${requestId}] POST /api/workflow/agent - Starting request`);
  console.log(
    `📝 [${requestId}] Request body:`,
    JSON.stringify(req.body, null, 2)
  );
  console.log(`🎯 [${requestId}] Looking for agentId: "${agentId}"`);

  if (!agentId) {
    console.log(`❌ [${requestId}] Missing agentId in request body`);
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message: "agentId is required",
    });
  }

  // Get ElevenLabs API key
  const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

  if (!elevenLabsApiKey) {
    console.error(
      `❌ [${requestId}] ELEVEN_LABS_API_KEY not found in environment variables`
    );
    return res.status(500).json({
      success: false,
      error: "Configuration Error",
      message: "ElevenLabs API key not configured",
    });
  }

  console.log(
    `🔗 [${requestId}] Creating ElevenLabs client and requesting signed URL for agent: ${agentId}`
  );

  // Initialize ElevenLabs client and get signed URL
  const elevenlabs = new ElevenLabsClient({
    apiKey: elevenLabsApiKey,
  });

  console.log(
    `📡 [${requestId}] Making API call to ElevenLabs conversational AI (using .conversations.getSignedUrl)...`
  );

  try {
    // Use the method structure from the provided snippet
    const response =
      await elevenlabs.conversationalAi.conversations.getSignedUrl({
        agentId: agentId,
      });

    console.log(
      `✅ [${requestId}] Successfully retrieved signed URL from ElevenLabs`
    );
    console.log("response:", response);

    // Use signed_url (snake_case) as per the snippet's implication
    console.log(
      `🔑 [${requestId}] Signed URL: ${response.signedUrl.substring(0, 50)}...`
    );

    res.json({
      success: true,
      data: {
        agentId: agentId,
        signedUrl: response.signedUrl, // Use signedUrl
        expiresIn: "15 minutes",
      },
      message: "Signed URL generated successfully",
    });
  } catch (error) {
    console.error(`❌ [${requestId}] Error generating signed URL:`, error);

    // Handle specific ElevenLabs API errors
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: `Agent with ID ${agentId || "unknown"} not found`,
      });
    }

    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Invalid ElevenLabs API key",
      });
    }

    if (error.statusCode) {
      return res.status(502).json({
        success: false,
        error: "External API Error",
        message: `ElevenLabs API returned ${error.statusCode}`,
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to generate signed URL",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

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

module.exports = app;
