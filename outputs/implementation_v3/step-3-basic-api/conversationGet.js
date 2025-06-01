/**
 * Simple script to get an ElevenLabs conversation using the Get Conversation API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/conversations/get-conversation
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get API key from environment variables
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Default conversation ID to use if none is provided via command line
const DEFAULT_CONVERSATION_ID = "conv_01jwck49yzf8ssrqb8xbx3xp0r"; // Replace with your default conversation ID

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

/**
 * Function to get a specific conversation by ID
 * @param {string} conversationId - The ID of the conversation to retrieve
 * @returns {Promise<Object>} - The conversation details
 */
async function getConversation(conversationId) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;

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
      throw new Error(
        `Failed to get conversation: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting conversation:", error);
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

    // Get conversation ID from command line arguments or use default
    const conversationId = process.argv[2] || DEFAULT_CONVERSATION_ID;

    if (process.argv[2]) {
      console.log(`Using conversation ID from command line: ${conversationId}`);
    } else {
      console.log(
        `No conversation ID provided, using default: ${conversationId}`
      );
    }

    console.log(
      `Fetching details for conversation with ID: ${conversationId}...`
    );
    const conversationData = await getConversation(conversationId);

    // Save to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilePath = path.join(
      outputsDir,
      `conversation-get-${conversationId}-${timestamp}.json`
    );
    fs.writeFileSync(outputFilePath, JSON.stringify(conversationData, null, 2));
    console.log(`\nSaved conversation details to ${outputFilePath}`);

    // Display summary in console
    console.log("\n===== Conversation Details =====");
    console.log(`ID: ${conversationData.conversation_id}`);
    console.log(`Agent ID: ${conversationData.agent_id}`);
    console.log(`Agent Name: ${conversationData.agent_name}`);

    // Display conversation status
    console.log("\n--- Status Information ---");
    console.log(`Status: ${conversationData.status}`);
    if (conversationData.metadata) {
      console.log(
        `Created: ${new Date(
          conversationData.metadata.created_at_unix_secs * 1000
        ).toLocaleString()}`
      );
      console.log(
        `Updated: ${new Date(
          conversationData.metadata.updated_at_unix_secs * 1000
        ).toLocaleString()}`
      );
    }

    // Display conversation statistics
    console.log("\n--- Conversation Statistics ---");
    const stats = conversationData.stats || {};
    console.log(`Duration: ${stats.duration_seconds || 0} seconds`);
    console.log(`Total Turns: ${stats.turn_count || 0}`);
    console.log(`User Message Count: ${stats.user_message_count || 0}`);
    console.log(`Agent Message Count: ${stats.agent_message_count || 0}`);

    // Display messages if available
    if (conversationData.messages && conversationData.messages.length > 0) {
      console.log("\n--- Messages ---");
      console.log(`Total Messages: ${conversationData.messages.length}`);

      // Display the latest few messages as a sample
      const messagesToShow = Math.min(3, conversationData.messages.length);
      console.log(`\nLatest ${messagesToShow} messages:`);

      const latestMessages = conversationData.messages.slice(-messagesToShow);
      latestMessages.forEach((message, index) => {
        const timestamp = new Date(
          message.created_at_unix_secs * 1000
        ).toLocaleString();
        console.log(
          `\n[${timestamp}] ${message.sender === "user" ? "User" : "Agent"}:`
        );
        console.log(
          `"${message.text.slice(0, 100)}${
            message.text.length > 100 ? "..." : ""
          }"`
        );
      });
    }

    console.log(
      "\nFull conversation details have been saved to the output file."
    );
  } catch (error) {
    console.error("Failed to get conversation details:", error);
  }
}

// Export functions for use in other modules
module.exports = {
  getConversation,
};

// Run the script if it's called directly
if (require.main === module) {
  main();
}
