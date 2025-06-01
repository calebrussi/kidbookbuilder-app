// Node.js script to create ElevenLabs agents and update their configs in a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the createAgent function from step-3 folder
const { createAgent } = require("../step-3-basic-api/agentCreate.js");

// Configuration
const promptFlowFilePath = path.join(
  __dirname,
  "outputs",
  "CharacterCreationQuizPromptFlow.json"
); // Default path, can be changed

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompts user for confirmation to continue
 * @param {string} message - Message to display to user
 * @returns {Promise<boolean>} - User's response (true for yes, false for no)
 */
function askUserToContinue(message = "Do you want to continue? (Y/n): ") {
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      const response = answer.toLowerCase().trim();
      // Default to yes if the user just presses Enter without typing anything
      resolve(response === "" || response === "y" || response === "yes");
    });
  });
}

/**
 * Checks if a node has an elevenlabs_config that can be used to create an agent
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config exists and has required fields
 */
function hasValidElevenLabsConfig(node) {
  return (
    node.elevenlabs_config &&
    typeof node.elevenlabs_config === "object" &&
    Object.keys(node.elevenlabs_config).length > 0 &&
    node.elevenlabs_config.name
  );
}

/**
 * Checks if the elevenlabs_config already has agent creation response data
 * @param {Object} node - The node to check
 * @returns {boolean} - True if agent_id or agent creation data exists
 */
function hasAgentCreationData(node) {
  return (
    node.elevenlabs_config &&
    (node.elevenlabs_config.agent_id || node.elevenlabs_config.created_agent)
  );
}

/**
 * Creates an ElevenLabs agent using the node's elevenlabs_config
 * @param {Object} node - The node with elevenlabs_config to create agent from
 * @returns {Promise<Object>} - The agent creation response
 */
async function createElevenLabsAgent(node) {
  try {
    if (!hasValidElevenLabsConfig(node)) {
      throw new Error(
        `Node ${node.name} does not have a valid elevenlabs_config to create an agent from`
      );
    }

    const agentConfig = node.elevenlabs_config;

    console.log(`Creating ElevenLabs agent with name: ${agentConfig.name}...`);

    // Create the agent using the agentCreate function
    const createdAgent = await createAgent(agentConfig);

    console.log(
      `✅ Successfully created agent with ID: ${createdAgent.agent_id}`
    );

    return createdAgent;
  } catch (error) {
    console.error(
      `❌ Error creating ElevenLabs agent for ${node.name}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Appends agent creation response to the node's elevenlabs_config
 * @param {Object} node - The node to update
 * @param {Object} agentResponse - The agent creation response
 * @returns {Object} - The updated elevenlabs_config
 */
function appendAgentResponseToConfig(node, agentResponse) {
  const updatedConfig = {
    agent_id: agentResponse.agent_id,
    created_at: new Date().toISOString(),
    ...node.elevenlabs_config,
  };

  return updatedConfig;
}

/**
 * Main function to process the prompt flow and create agents
 * @param {string} filePath - Path to the promptFlow.json file
 */
async function createElevenLabsAgents(filePath = promptFlowFilePath) {
  try {
    console.log(`Reading prompt flow from: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    // Read and parse the prompt flow JSON
    const promptFlowData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!Array.isArray(promptFlowData)) {
      console.error("The prompt flow file should contain an array of nodes");
      process.exit(1);
    }

    console.log(`Found ${promptFlowData.length} items in the prompt flow`);

    // Filter nodes that have valid elevenlabs_config but don't have agent creation data
    const nodesToProcess = promptFlowData.filter((item) => {
      // Skip groups (they don't need ElevenLabs agents)
      if (item.id.startsWith("group_")) {
        return false;
      }

      // Only process nodes that have valid elevenlabs_config and don't already have agent data
      return hasValidElevenLabsConfig(item) && !hasAgentCreationData(item);
    });

    console.log(
      `Found ${nodesToProcess.length} nodes that can have ElevenLabs agents created`
    );

    if (nodesToProcess.length === 0) {
      console.log(
        "All eligible nodes already have agent creation data! Nothing to do."
      );
      rl.close();
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes to process:");
    nodesToProcess.forEach((node, index) => {
      console.log(
        `  ${index + 1}. ${node.name} (${node.id}) - ${
          node.elevenlabs_config.name
        }`
      );
    });

    // Process nodes one by one
    for (let i = 0; i < nodesToProcess.length; i++) {
      const node = nodesToProcess[i];

      console.log(`\n--- Creating Agent ${i + 1}/${nodesToProcess.length} ---`);
      console.log(`Node ID: ${node.id}`);
      console.log(`Node Name: ${node.name}`);
      console.log(`Agent Name: ${node.elevenlabs_config.name}`);
      console.log(`Description: ${node.description}`);

      // Ask user if they want to create an agent for this node
      const shouldCreate = await askUserToContinue(
        `Create ElevenLabs agent for "${node.name}"? (Y/n): `
      );

      if (!shouldCreate) {
        console.log("Skipping this node...");
        continue;
      }

      try {
        console.log("\nCreating ElevenLabs agent...");

        // Create the ElevenLabs agent
        const agentResponse = await createElevenLabsAgent(node);

        // Append the agent response to the node's elevenlabs_config
        const nodeIndex = promptFlowData.findIndex(
          (item) => item.id === node.id
        );
        if (nodeIndex !== -1) {
          promptFlowData[nodeIndex].elevenlabs_config =
            appendAgentResponseToConfig(node, agentResponse);
          console.log(
            `✅ Successfully appended agent data to elevenlabs_config for ${node.name}`
          );
        }

        // Save the updated prompt flow back to file
        fs.writeFileSync(filePath, JSON.stringify(promptFlowData, null, 2));
        console.log(`💾 Updated prompt flow saved to: ${filePath}`);

        // Save individual agent response for reference
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const agentOutputPath = path.join(
          __dirname,
          "outputs",
          `agent-${agentResponse.agent_id}-${timestamp}.json`
        );
        fs.writeFileSync(
          agentOutputPath,
          JSON.stringify(agentResponse, null, 2)
        );
        console.log(`📄 Agent response saved to: ${agentOutputPath}`);
      } catch (error) {
        console.error(
          `❌ Error creating ElevenLabs agent for ${node.name}:`,
          error.message
        );

        const shouldContinueOnError = await askUserToContinue(
          "An error occurred. Do you want to continue with the next node? (Y/n): "
        );

        if (!shouldContinueOnError) {
          console.log("Stopping execution due to user request.");
          break;
        }
      }
    }

    console.log("\n🎉 ElevenLabs agent creation process completed!");
  } catch (error) {
    console.error("❌ Error in main process:", error);
  } finally {
    rl.close();
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 Starting ElevenLabs Agent Creation Process");
  console.log("=============================================");

  // Check if a custom file path was provided as command line argument
  const customFilePath = process.argv[2];

  if (customFilePath) {
    console.log(`Using custom prompt flow file: ${customFilePath}`);
    await createElevenLabsAgents(customFilePath);
  } else {
    console.log(`Using default prompt flow file: ${promptFlowFilePath}`);
    await createElevenLabsAgents();
  }
}

// Export functions for use in other modules
module.exports = {
  createElevenLabsAgents,
  hasValidElevenLabsConfig,
  hasAgentCreationData,
  createElevenLabsAgent,
  appendAgentResponseToConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
