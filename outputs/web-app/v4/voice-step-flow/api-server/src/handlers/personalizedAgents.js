// API endpoint for creating personalized agents
// This would integrate with your existing agent creation scripts

export async function createPersonalizedAgent(req, res) {
  try {
    const { stepId, userId, prompt, userPersonalization } = req.body;

    console.log(
      `🤖 Creating personalized agent for user ${userId}, step ${stepId}`
    );

    // Generate agent configuration based on user data
    const agentConfig = {
      name: `${userPersonalization?.userName || "User"}'s ${stepId} Assistant`,
      prompt: prompt,
      voice: selectVoiceForUser(userPersonalization),
      conversational_config: {
        turn_detection: { type: "server_vad" },
      },
      language: "en",
    };

    // Call ElevenLabs API to create agent
    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(agentConfig),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const { agent_id } = await response.json();

    console.log(`✅ Created personalized agent: ${agent_id}`);

    res.json({
      success: true,
      agentId: agent_id,
      config: agentConfig,
    });
  } catch (error) {
    console.error("❌ Error creating personalized agent:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function cleanupUserAgents(req, res) {
  try {
    const { userId, agentIds } = req.body;

    console.log(`🧹 Cleaning up ${agentIds.length} agents for user ${userId}`);

    // Delete each agent from ElevenLabs
    const deletePromises = agentIds.map(async (agentId) => {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
          {
            method: "DELETE",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
            },
          }
        );

        if (response.ok) {
          console.log(`✅ Deleted agent: ${agentId}`);
          return { agentId, success: true };
        } else {
          console.warn(`⚠️ Failed to delete agent: ${agentId}`);
          return { agentId, success: false };
        }
      } catch (error) {
        console.error(`❌ Error deleting agent ${agentId}:`, error);
        return { agentId, success: false, error: error.message };
      }
    });

    const results = await Promise.all(deletePromises);

    res.json({
      success: true,
      results,
      deletedCount: results.filter((r) => r.success).length,
    });
  } catch (error) {
    console.error("❌ Error cleaning up user agents:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Helper function to select appropriate voice based on user data
function selectVoiceForUser(userPersonalization) {
  // Could be more sophisticated based on age, preferences, etc.
  const age = userPersonalization?.age || 10;

  if (age < 8) {
    return "pNInz6obpgDQGcFmaJgB"; // Young child voice
  } else if (age < 12) {
    return "21m00Tcm4TlvDq8ikWAM"; // Older child voice
  } else {
    return "EXAVITQu4vr4xnSDxMaL"; // Teen voice
  }
}
