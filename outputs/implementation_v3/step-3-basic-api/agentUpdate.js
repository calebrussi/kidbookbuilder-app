/**
 * Simple script to update an ElevenLabs agent using the Update Agent API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/agents/update
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get API key from environment variables
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Agent ID to update - replace with the actual agent ID you want to update
const AGENT_ID = "agent_01jw4g1e4yf159j9mr2svhsy2w";

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

/**
 * Function to update an agent using the provided configuration
 * @param {string} agentId - The ID of the agent to update
 * @param {Object} updateConfig - The agent update configuration object
 * @returns {Promise<Object>} - The updated agent details
 */
async function updateAgent(agentId, updateConfig) {
  if (!agentId) {
    throw new Error("Agent ID is required");
  }

  if (!updateConfig) {
    throw new Error("Update configuration is required");
  }

  const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateConfig),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update agent: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating agent:", error);
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

    // Check for valid agent ID
    if (!AGENT_ID || AGENT_ID === "YOUR_AGENT_ID_HERE") {
      console.error(
        "Error: Please set a valid AGENT_ID in the script before running"
      );
      process.exit(1);
    }

    console.log(`Fetching current details for agent ID: ${AGENT_ID}...`);
    const currentAgent = await getAgent(AGENT_ID);

    // Prepare update configuration - just changing the name by appending "Chicken"
    const updateConfig = {
      name: `${currentAgent.name} Chicken`,
    };

    console.log(`Current agent name: ${currentAgent.name}`);
    console.log(`Updating agent name to: ${updateConfig.name}...`);

    // Update the agent
    const updatedAgent = await updateAgent(AGENT_ID, updateConfig);

    // Save update response to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilePath = path.join(
      outputsDir,
      `agent-update-response-${timestamp}.json`
    );
    fs.writeFileSync(outputFilePath, JSON.stringify(updatedAgent, null, 2));
    console.log(`\nSaved update response to ${outputFilePath}`);

    // Display update summary
    console.log("\n===== Updated Agent =====");
    console.log(`ID: ${updatedAgent.agent_id}`);
    console.log(`Original Name: ${currentAgent.name}`);
    console.log(`New Name: ${updatedAgent.name}`);

    // Fetch complete updated agent details
    console.log(
      `\nFetching complete updated details for agent ID: ${AGENT_ID}...`
    );
    const updatedAgentData = await getAgent(AGENT_ID);

    // Save complete updated agent details to JSON file
    const detailsFilePath = path.join(
      outputsDir,
      `agent-update-${AGENT_ID}-${timestamp}.json`
    );
    fs.writeFileSync(
      detailsFilePath,
      JSON.stringify(updatedAgentData, null, 2)
    );
    console.log(`\nSaved complete updated agent details to ${detailsFilePath}`);

    console.log("\nAgent has been successfully updated!");
  } catch (error) {
    console.error("Failed to update agent:", error);
  }
}

// Run the script
main();
