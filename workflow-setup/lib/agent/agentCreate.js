/**
 * Simple script to create an ElevenLabs agent using the Create Agent API endpoint
 * https://elevenlabs.io/docs/conversational-ai/api-reference/agents/create
 */

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { getAgent } = require("./agentGet.js");

// Get API key from environment variables
const API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Default agent configuration file path
const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "..",
  "..",
  "inputs",
  "agent_create_1.json"
);

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "..", "..", "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

// Create specific directory for agent responses
const agentResponsesDir = path.join(__dirname, "outputs");
if (!fs.existsSync(agentResponsesDir)) {
  fs.mkdirSync(agentResponsesDir, { recursive: true });
  console.log(`Created agent responses directory: ${agentResponsesDir}`);
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

  let response;
  let rawResponseText = "";
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentConfig),
    });

    // Save raw response for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const rawResponsePath = path.join(
      agentResponsesDir,
      `agent-raw-response-${timestamp}.txt`
    );

    // Try to get response text and save it regardless of whether it's valid JSON
    try {
      rawResponseText = await response.text();
      fs.writeFileSync(rawResponsePath, rawResponseText);
      console.log(`\nSaved raw API response to ${rawResponsePath}`);

      // Now try to parse as JSON
      if (!response.ok) {
        // Try to parse error as JSON
        try {
          const errorData = JSON.parse(rawResponseText);
          throw new Error(
            `Failed to create agent: ${JSON.stringify(errorData)}`
          );
        } catch (parseError) {
          // If we can't parse as JSON, include the raw text
          throw new Error(
            `Failed to create agent: ${rawResponseText.substring(0, 500)}...`
          );
        }
      }

      // Parse successful response
      const data = JSON.parse(rawResponseText);
      return data;
    } catch (responseError) {
      console.error("Error processing response:", responseError);
      throw responseError;
    }
  } catch (error) {
    console.error("Error creating agent:", error);

    // Save error details for debugging
    const errorPath = path.join(
      agentResponsesDir,
      `agent-error-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    );

    fs.writeFileSync(
      errorPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          responseCode: response?.code,
          error: error.message,
          stack: error.stack,
          rawResponseText: rawResponseText,
        },
        null,
        2
      )
    );

    console.log(`\nSaved error details to ${errorPath}`);
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

    // Generate timestamp for file naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Always save creation response to JSON file
    const outputFilePath = path.join(
      outputsDir,
      `agent-create-response-${timestamp}.json`
    );
    fs.writeFileSync(outputFilePath, JSON.stringify(createdAgent, null, 2));
    console.log(`\nSaved create response to ${outputFilePath}`);

    // Also save to the agent/outputs directory for easy access
    const agentOutputPath = path.join(
      agentResponsesDir,
      `agent-create-response-${createdAgent.agent_id}.json`
    );
    fs.writeFileSync(agentOutputPath, JSON.stringify(createdAgent, null, 2));
    console.log(`\nSaved create response to ${agentOutputPath}`);

    // Display initial creation summary
    console.log("\n===== Created Agent =====");
    console.log(`ID: ${createdAgent.agent_id}`);

    // Always save the full agent configuration with ID for reference
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

    // Also save to the agent/outputs directory for easy access
    const agentConfigPath = path.join(
      agentResponsesDir,
      `agent-create-request-${createdAgent.agent_id}.json`
    );
    fs.writeFileSync(agentConfigPath, JSON.stringify(configWithId, null, 2));
    console.log(`\nSaved agent configuration with ID to ${agentConfigPath}`);

    // Fetch complete agent details using GET endpoint
    console.log(
      `\nFetching complete details for agent ID: ${createdAgent.agent_id}...`
    );
    const agentData = await getAgent(createdAgent.agent_id);

    // Always save complete agent details to JSON file
    const detailsFilePath = path.join(
      outputsDir,
      `agent-create-${createdAgent.agent_id}-${timestamp}.json`
    );
    fs.writeFileSync(detailsFilePath, JSON.stringify(agentData, null, 2));
    console.log(`\nSaved complete agent details to ${detailsFilePath}`);

    // Also save to the agent/outputs directory for easy access
    const agentDetailsPath = path.join(
      agentResponsesDir,
      `agent-create-${createdAgent.agent_id}-details.json`
    );
    fs.writeFileSync(agentDetailsPath, JSON.stringify(agentData, null, 2));
    console.log(`\nSaved complete agent details to ${agentDetailsPath}`);

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

// Run the script if it's called directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  createAgent,
};
