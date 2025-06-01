const fetch = require("node-fetch");

/**
 * Get conversation endpoint
 */
const getConversationHandler = async (req, res) => {
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
};

module.exports = { getConversationHandler };
