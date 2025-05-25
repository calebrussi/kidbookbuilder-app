/**
 * Simple script to list ElevenLabs agents using the List Agents API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/agents/list
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
 * Function to list all agents
 * @param {Object} options - Configuration options
 * @param {number} [options.pageSize=30] - Number of agents to return (max 100)
 * @param {string} [options.search] - Optional search term to filter agents by name
 * @param {string} [options.cursor] - Cursor for pagination
 * @returns {Promise<Object>} - The response containing the list of agents
 */
async function listAgents({
  pageSize = 30,
  search = null,
  cursor = null,
} = {}) {
  // Build query parameters
  const queryParams = new URLSearchParams();

  if (pageSize) {
    queryParams.append("page_size", pageSize);
  }

  if (search) {
    queryParams.append("search", search);
  }

  if (cursor) {
    queryParams.append("cursor", cursor);
  }

  // Construct the URL with query parameters
  const url = `https://api.elevenlabs.io/v1/convai/agents${
    queryParams.toString() ? "?" + queryParams.toString() : ""
  }`;

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
      throw new Error(`Failed to list agents: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error listing agents:", error);
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

    console.log("Fetching list of ElevenLabs agents...");
    const agentList = await listAgents();

    // Save to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilePath = path.join(
      outputsDir,
      `agent-list-${timestamp}.json`
    );
    fs.writeFileSync(outputFilePath, JSON.stringify(agentList, null, 2));
    console.log(`\nSaved agent list to ${outputFilePath}`);

    // Display in console
    console.log("\n===== Agent List =====");
    if (agentList.agents && agentList.agents.length > 0) {
      agentList.agents.forEach((agent, index) => {
        console.log(`\nAgent ${index + 1}:`);
        console.log(`ID: ${agent.agent_id}`);
        console.log(`Name: ${agent.name}`);
        console.log(`Tags: ${agent.tags ? agent.tags.join(", ") : "No tags"}`);
        console.log(
          `Created: ${new Date(
            agent.created_at_unix_secs * 1000
          ).toLocaleString()}`
        );
      });

      console.log(`\nTotal agents: ${agentList.agents.length}`);
      console.log(`Has more: ${agentList.has_more}`);
      if (agentList.next_cursor) {
        console.log(`Next cursor: ${agentList.next_cursor}`);
      }
    } else {
      console.log("No agents found.");
      console.log("Empty response saved to the output file.");
    }
  } catch (error) {
    console.error("Failed to list agents:", error);
  }
}

// Run the script
main();
