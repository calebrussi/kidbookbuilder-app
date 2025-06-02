/**
 * Simple script to get an ElevenLabs agent using the Get Agent API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/agents/get
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get API key from environment variables
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Default agent ID to use if none is provided via command line
const DEFAULT_AGENT_ID = "agent_01jw9nbs4ye9hb450d9gdn16gx"; // Replace with your default agent ID

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

/**
 * Function to get a specific agent by ID
 * @param {string} agentId - The ID of the agent to retrieve
 * @returns {Promise<Object>} - The agent details
 */
async function getAgent(agentId) {
  if (!agentId) {
    throw new Error("Agent ID is required");
  }

  const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get agent: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
}

// Execute the function and display results
async function main() {
  try {
    // Check for API key
    if (!API_KEY) {
      console.error(
        "Error: API key is required. Please set the ELEVEN_LABS_API_KEY environment variable in .env file"
      );
      process.exit(1);
    }

    // Get agent ID from command line arguments or use default
    const agentId = process.argv[2] || DEFAULT_AGENT_ID;

    if (process.argv[2]) {
      console.log(`Using agent ID from command line: ${agentId}`);
    } else {
      console.log(`No agent ID provided, using default: ${agentId}`);
    }

    console.log(`Fetching details for agent with ID: ${agentId}...`);
    const agentData = await getAgent(agentId);

    // Save to JSON file
    // Save agent details to file only if DEBUG is enabled
    if (process.env.DEBUG === "true") {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const outputFilePath = path.join(
        outputsDir,
        `agent-get-${agentId}-${timestamp}.json`
      );
      fs.writeFileSync(outputFilePath, JSON.stringify(agentData, null, 2));
      console.log(`\nSaved agent details to ${outputFilePath}`);
    }

    // Display summary in console
    console.log("\n===== Agent Details =====");
    console.log(`ID: ${agentData.agent_id}`);
    console.log(`Name: ${agentData.name}`);

    // Display conversation config summary
    console.log("\n--- Conversation Configuration ---");
    console.log(
      `First Message: "${agentData.conversation_config.agent.first_message}"`
    );
    console.log(`Language: ${agentData.conversation_config.agent.language}`);
    console.log(`LLM: ${agentData.conversation_config.agent.prompt.llm}`);
    console.log(`Voice ID: ${agentData.conversation_config.tts.voice_id}`);
    console.log(
      `Text only: ${agentData.conversation_config.conversation.text_only}`
    );
    console.log(
      `Max Duration: ${agentData.conversation_config.conversation.max_duration_seconds} seconds`
    );

    // Display metadata
    if (agentData.metadata) {
      console.log(
        `\nCreated: ${new Date(
          agentData.metadata.created_at_unix_secs * 1000
        ).toLocaleString()}`
      );
    }

    // Display tags if available
    if (agentData.tags && agentData.tags.length > 0) {
      console.log(`\nTags: ${agentData.tags.join(", ")}`);
    }

    // Display knowledge base information if available
    const knowledgeBase =
      agentData.conversation_config.agent.prompt.knowledge_base;
    if (knowledgeBase && knowledgeBase.length > 0) {
      console.log("\n--- Knowledge Base ---");
      knowledgeBase.forEach((kb, index) => {
        console.log(
          `${index + 1}. Name: ${kb.name}, Type: ${kb.type}, ID: ${kb.id}`
        );
      });
    }

    // Display tools information if available
    const tools = agentData.conversation_config.agent.prompt.tools;
    if (tools && tools.length > 0) {
      console.log("\n--- Tools ---");
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. Name: ${tool.name}, Type: ${tool.type}`);
      });
    }

    console.log("\nFull agent details have been saved to the output file.");
  } catch (error) {
    console.error("Failed to get agent details:", error);
  }
}

// Export functions for use in other modules
module.exports = {
  getAgent,
};

// Run the script if it's called directly
if (require.main === module) {
  main();
}
