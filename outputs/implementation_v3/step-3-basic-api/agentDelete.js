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

// Default agent ID to use if none is provided via command line
const DEFAULT_AGENT_ID = "agent_01jw4g1e4yf159j9mr2svhsy2w"; // Replace with your default agent ID

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

    // Ask for confirmation before deleting
    console.log(
      `\n⚠️ WARNING: You are about to delete agent with ID: ${agentId}`
    );
    console.log("This action cannot be undone.");

    // In a real script, you might want to add a confirmation prompt here
    // For this example, we'll just proceed with the deletion
    console.log("Proceeding with deletion...");

    console.log(`\nDeleting agent with ID: ${agentId}...`);
    const result = await deleteAgent(agentId);

    // Save response to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilePath = path.join(
      outputsDir,
      `agent-delete-${agentId}-${timestamp}.json`
    );
    fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
    console.log(`\nSaved deletion result to ${outputFilePath}`);

    // Display summary in console
    console.log("\n===== Deletion Result =====");
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
    } else {
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    }

    console.log("\nFull deletion details have been saved to the output file.");
  } catch (error) {
    console.error("\n❌ Failed to delete agent:", error.message);
  }
}

// Export functions for use in other modules
module.exports = {
  deleteAgent,
};

// Run the script if it's called directly
if (require.main === module) {
  main();
}
