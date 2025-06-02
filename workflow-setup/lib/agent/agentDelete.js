/**
 * Simple script to delete an ElevenLabs agent using the Delete Agent API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/agents/delete
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get API key from environment variables
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

/**
 * Function to delete a specific agent by ID
 * @param {string} agentId - The ID of the agent to delete
 * @returns {Promise<Object>} - The deletion response
 */
async function deleteAgent(agentId) {
  if (!agentId) {
    throw new Error("Agent ID is required");
  }

  const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Handle special case for 404 (agent not found)
      if (response.status === 404) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }

      // For other errors, try to get more information
      const errorData = await response.json();
      throw new Error(`Failed to delete agent: ${JSON.stringify(errorData)}`);
    }

    // If deletion was successful, the response might be empty
    // Check if there's content to parse
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      // Return a success message if no JSON response
      return {
        success: true,
        message: `Agent ${agentId} successfully deleted`,
      };
    }
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
}

// Export functions for use in other modules
module.exports = {
  deleteAgent,
};
