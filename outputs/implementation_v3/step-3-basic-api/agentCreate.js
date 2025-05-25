/**
 * Simple script to create an ElevenLabs agent using the Create Agent API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/agents/create
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get API key from environment variables
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Default agent configuration file path
const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "input",
  "agent_create_1.json"
);

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

/**
 * Function to create an agent using the provided configuration
 * @param {Object} agentConfig - The agent configuration object
 * @returns {Promise<Object>} - The created agent details
 */
async function createAgent(agentConfig) {
  if (!agentConfig) {
    throw new Error("Agent configuration is required");
  }

  const url = "https://api.elevenlabs.io/v1/convai/agents/create";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentConfig),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create agent: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
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

    // Get configuration file path from command line arguments or use default
    const configPath = process.argv[2] || DEFAULT_CONFIG_PATH;

    if (process.argv[2]) {
      console.log(`Using configuration file from command line: ${configPath}`);
    } else {
      console.log(
        `No configuration file provided, using default: ${configPath}`
      );
    }

    // Read and parse the configuration file
    console.log(`Reading agent configuration from: ${configPath}...`);
    const agentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

    console.log(`Creating agent with name: ${agentConfig.name}...`);
    const createdAgent = await createAgent(agentConfig);

    // Save creation response to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFilePath = path.join(
      outputsDir,
      `agent-create-response-${timestamp}.json`
    );
    fs.writeFileSync(outputFilePath, JSON.stringify(createdAgent, null, 2));
    console.log(`\nSaved create response to ${outputFilePath}`);

    // Display initial creation summary
    console.log("\n===== Created Agent =====");
    console.log(`ID: ${createdAgent.agent_id}`);

    // Save the full agent configuration with ID for reference
    const configWithIdPath = path.join(
      outputsDir,
      `agent-create-request-${createdAgent.agent_id}-${timestamp}.json`
    );

    // Create a copy of the config and add the agent ID
    const configWithId = {
      ...agentConfig,
      agent_id: createdAgent.agent_id,
    };

    fs.writeFileSync(configWithIdPath, JSON.stringify(configWithId, null, 2));
    console.log(`\nSaved agent configuration with ID to ${configWithIdPath}`);

    // Fetch complete agent details using GET endpoint
    console.log(
      `\nFetching complete details for agent ID: ${createdAgent.agent_id}...`
    );
    const agentData = await getAgent(createdAgent.agent_id);

    // Save complete agent details to JSON file
    const detailsFilePath = path.join(
      outputsDir,
      `agent-create-${createdAgent.agent_id}-${timestamp}.json`
    );
    fs.writeFileSync(detailsFilePath, JSON.stringify(agentData, null, 2));
    console.log(`\nSaved complete agent details to ${detailsFilePath}`);

    // Display detailed agent information
    console.log("\n===== Complete Agent Details =====");
    console.log(`ID: ${agentData.agent_id}`);
    console.log(`Name: ${agentData.name}`);

    // Display conversation config summary
    console.log("\n--- Conversation Configuration ---");
    console.log(
      `First Message: "${agentData.conversation_config.agent.first_message}"`
    );
    console.log(`Language: ${agentData.conversation_config.agent.language}`);
    console.log(`LLM: ${agentData.conversation_config.agent.prompt.llm}`);

    // Display TTS settings if available
    if (agentData.conversation_config.tts) {
      console.log(
        `Voice ID: ${
          agentData.conversation_config.tts.voice_id || "Not specified"
        }`
      );
    }

    // Display conversation settings if available
    if (agentData.conversation_config.conversation) {
      console.log(
        `Text only: ${
          agentData.conversation_config.conversation.text_only || false
        }`
      );
      console.log(
        `Max Duration: ${
          agentData.conversation_config.conversation.max_duration_seconds ||
          "Not specified"
        } seconds`
      );
    }

    // Display metadata if available
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

    // Display tools information if available
    const tools = agentData.conversation_config.agent.prompt.tools;
    if (tools && tools.length > 0) {
      console.log("\n--- Tools ---");
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. Name: ${tool.name}, Type: ${tool.type}`);
      });
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

    // Display evaluation criteria if available
    const evaluationCriteria =
      agentData.platform_settings?.evaluation?.criteria;
    if (evaluationCriteria && evaluationCriteria.length > 0) {
      console.log("\n--- Evaluation Criteria ---");
      evaluationCriteria.forEach((criterion, index) => {
        console.log(
          `${index + 1}. ID: ${criterion.id}, Name: ${criterion.name}, Type: ${
            criterion.type
          }`
        );
      });
    }

    // Display data collection fields if available
    const dataCollection = agentData.platform_settings?.data_collection;
    if (dataCollection) {
      console.log("\n--- Data Collection Fields ---");
      Object.keys(dataCollection).forEach((key, index) => {
        console.log(`${index + 1}. ${key}: ${dataCollection[key].description}`);
      });
    }

    console.log(
      "\nAgent has been successfully created and details retrieved! Use the agent ID for future operations."
    );
  } catch (error) {
    console.error("Failed to create agent:", error);
  }
}

// Run the script
main();
