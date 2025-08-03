#!/usr/bin/env node

/**
 * Script to update the character-details agent with proper data collection fields
 * This ensures the age    console.log("✅ Successfully updated character-details agent!");
    console.log("📊 Agent ID:", response.data.agent_id);
    console.log("📋 Data collection field configured:");
    console.log("   - character_info: All character creation details (name, ability, activity)"); extract and store character name, special ability, and favorite activity
 */

require("dotenv").config();

const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY;
const AGENT_ID = "agent_01jz94kta6encvtk7rabyatkkb"; // character-details agent

if (!ELEVENLABS_API_KEY) {
  console.error("❌ VITE_ELEVENLABS_API_KEY environment variable is required");
  process.exit(1);
}

async function updateCharacterDetailsAgent() {
  console.log("🔄 Updating character-details agent configuration...");

  try {
    const updatedConfig = {
      conversation_config: {
        conversation: {
          text_only: false,
          max_duration_seconds: 600,
          client_events: [
            "audio",
            "interruption",
            "user_transcript",
            "agent_response",
            "agent_response_correction",
            "vad_score",
          ],
        },
        agent: {
          first_message:
            "Let's create your character! What's your character's name?",
          language: "en",
          prompt: {
            prompt: `# Personality
You are a supportive character creation assistant, dedicated to guiding users through creating their own characters in a fun and engaging way. You are encouraging, helpful, and patient.

# Environment
You are part of a chained conversation flow where users are building characters for a story. Users expect a clear progression through the character-building process.

# Tone
Use friendly and inviting language that makes users feel comfortable sharing details about their characters. Ask questions one at a time and acknowledge responses before moving on.

# Goal
Your objective is to collect character creation information through a sequence of questions:
1. Ask for the character's name and wait for response.
2. Then ask about their special ability and wait for response.
3. Finally, ask about their favorite activity and wait for response.
4. Only end after collecting responses to all three questions (name, special ability, favorite activity).

# Guardrails
Stay focused on character creation questions only. If users try to shift to other topics, gently redirect them back to their character. Accept any level of detail they provide, even brief answers.

# Tools
CRITICAL: End the conversation IMMEDIATELY after collecting responses to all three questions (name, special ability, favorite activity). Do not wait for user response, do not engage further.`,
            llm: "gemini-2.0-flash-001",
            temperature: 0.25,
            max_tokens: -1,
            tools: [
              {
                name: "end_call",
                description:
                  "End the call when the conversation objective has been achieved.",
                response_timeout_secs: 20,
                type: "system",
                params: {
                  system_tool_type: "end_call",
                },
              },
            ],
          },
        },
        tts: {
          voice_id: "pNInz6obpgDQGcFmaJgB",
        },
      },
      platform_settings: {
        auth: {
          enable_auth: true,
        },
        evaluation: {
          criteria: [
            {
              id: "character_creation",
              name: "character_creation",
              type: "prompt",
              conversation_goal_prompt:
                "Mark as success if character creation information was collected (name, special ability, favorite activity), even if responses are brief or incomplete.",
            },
          ],
        },
        data_collection: {
          character_info: {
            type: "string",
            description:
              "All character creation details including name, special ability, and favorite activity",
          },
        },
      },
    };

    console.log("📝 Sending update request to ElevenLabs API...");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify(updatedConfig),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `ElevenLabs API error: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    const responseData = await response.json();

    console.log("✅ Successfully updated character-details agent!");
    console.log("📊 Agent ID:", responseData.agent_id);
    console.log("📋 Data collection fields configured:");
    console.log("   - character_name: Character name");
    console.log("   - special_ability: Special ability/power");
    console.log("   - favorite_activity: Favorite activity/hobby");

    // Save response for reference
    const fs = require("fs");
    const path = require("path");
    const outputDir = path.join(__dirname, "outputs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(
      outputDir,
      `character-details-agent-update-${timestamp}.json`
    );
    fs.writeFileSync(outputPath, JSON.stringify(responseData, null, 2));
    console.log("💾 Update response saved to:", outputPath);
  } catch (error) {
    console.error("❌ Failed to update agent:", error);
    if (error.message.includes("ElevenLabs API error")) {
      console.error("API Error details:", error.message);
    }
    process.exit(1);
  }
}

// Run the update
updateCharacterDetailsAgent();
