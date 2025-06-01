const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");

/**
 * Get signed URL for workflow step endpoint
 */
const getSignedUrlHandler = async (req, res) => {
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
};

module.exports = { getSignedUrlHandler };
