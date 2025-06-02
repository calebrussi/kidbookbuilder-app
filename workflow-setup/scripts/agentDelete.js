// Node.js script to delete ElevenLabs agents from a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the deleteAgent function from local lib folder
const { deleteAgent } = require("../lib/agent/agentDelete.js");

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Prompts user for input
 * @param {string} question - Question to ask the user
 * @returns {Promise<string>} - User's response
 */
function askUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

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
 * Checks if a node has an elevenlabs_config with an agent_id
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config exists and has agent_id
 */
function hasElevenLabsAgent(node) {
  return (
    node.elevenlabs_config &&
    typeof node.elevenlabs_config === "object" &&
    node.elevenlabs_config.agent_id
  );
}

/**
 * Deletes an ElevenLabs agent using the node's elevenlabs_config
 * @param {Object} node - The node with elevenlabs_config containing agent_id
 * @returns {Promise<Object>} - The agent deletion response
 */
async function deleteElevenLabsAgent(node) {
  try {
    if (!hasElevenLabsAgent(node)) {
      throw new Error(`Node ${node.name} does not have an agent_id to delete`);
    }

    const agentId = node.elevenlabs_config.agent_id;

    console.log(`Deleting ElevenLabs agent with ID: ${agentId}...`);

    // Delete the agent using the agentDelete function
    const deletionResult = await deleteAgent(agentId);

    console.log(`✅ Successfully deleted agent with ID: ${agentId}`);

    return deletionResult;
  } catch (error) {
    console.error(
      `❌ Error deleting ElevenLabs agent for ${node.name}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Removes agent_id and created_at from the node's elevenlabs_config
 * @param {Object} node - The node to update
 * @returns {Object} - The updated elevenlabs_config
 */
function removeAgentDataFromConfig(node) {
  const updatedConfig = { ...node.elevenlabs_config };

  // Remove agent_id and created_at properties
  delete updatedConfig.agent_id;
  delete updatedConfig.created_at;

  return updatedConfig;
}

/**
 * Main function to process the prompt flow and delete agents
 * @param {string} filePath - Path to the promptFlow.json file
 * @param {Object} options - Additional options for processing
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<void>}
 */
async function deleteElevenLabsAgents(filePath, options = {}) {
  const { outputDir = path.join(__dirname, "..", "outputs") } = options;

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

    // Filter nodes that have elevenlabs_config with agent_id
    const nodesToProcess = promptFlowData.filter((item) => {
      // Skip groups (they don't need ElevenLabs agents)
      if (item.id.startsWith("group_")) {
        return false;
      }

      // Only process nodes that have elevenlabs_config with agent_id
      return hasElevenLabsAgent(item);
    });

    console.log(
      `Found ${nodesToProcess.length} nodes with ElevenLabs agents to potentially delete`
    );

    if (nodesToProcess.length === 0) {
      console.log("No nodes with ElevenLabs agents found! Nothing to delete.");
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes with ElevenLabs agents:");
    nodesToProcess.forEach((node, index) => {
      console.log(
        `  ${index + 1}. ${node.name} (${node.id}) - Agent ID: ${
          node.elevenlabs_config.agent_id
        }`
      );
    });

    console.log("\n⚠️ WARNING: Agent deletion cannot be undone!");
    const shouldProceed = await askUserToContinue(
      "Do you want to proceed with the deletion process? (Y/n): "
    );

    if (!shouldProceed) {
      console.log("Deletion process cancelled by user.");
      return;
    }

    // Process nodes one by one
    for (let i = 0; i < nodesToProcess.length; i++) {
      const node = nodesToProcess[i];

      console.log(`\n--- Deleting Agent ${i + 1}/${nodesToProcess.length} ---`);
      console.log(`Node ID: ${node.id}`);
      console.log(`Node Name: ${node.name}`);
      console.log(`Agent ID: ${node.elevenlabs_config.agent_id}`);
      console.log(`Agent Name: ${node.elevenlabs_config.name || "N/A"}`);
      console.log(`Description: ${node.description}`);

      // Ask user if they want to delete this specific agent
      const shouldDelete = await askUserToContinue(
        `Delete ElevenLabs agent "${node.elevenlabs_config.agent_id}" for "${node.name}"? (Y/n): `
      );

      if (!shouldDelete) {
        console.log("Skipping this agent...");
        continue;
      }

      try {
        console.log("\nDeleting ElevenLabs agent...");

        // Delete the ElevenLabs agent
        const deletionResult = await deleteElevenLabsAgent(node);

        // Remove agent data from the node's elevenlabs_config
        const nodeIndex = promptFlowData.findIndex(
          (item) => item.id === node.id
        );
        if (nodeIndex !== -1) {
          promptFlowData[nodeIndex].elevenlabs_config =
            removeAgentDataFromConfig(node);
          console.log(
            `✅ Successfully removed agent data from elevenlabs_config for ${node.name}`
          );
        }

        // Save the updated prompt flow back to file
        fs.writeFileSync(filePath, JSON.stringify(promptFlowData, null, 2));
        console.log(`💾 Updated prompt flow saved to: ${filePath}`);

        // Save individual deletion response for reference only if DEBUG is enabled
        if (process.env.DEBUG === "true") {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const deletionOutputPath = path.join(
            outputDir,
            `agent-deletion-${node.elevenlabs_config.agent_id}-${timestamp}.json`
          );
          fs.writeFileSync(
            deletionOutputPath,
            JSON.stringify(deletionResult, null, 2)
          );
          console.log(`📄 Deletion response saved to: ${deletionOutputPath}`);
        } else {
          console.log(
            `📄 Agent deleted successfully (file output disabled - set DEBUG=true to save files)`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error deleting ElevenLabs agent for ${node.name}:`,
          error.message
        );

        const shouldContinueOnError = await askUserToContinue(
          "An error occurred. Do you want to continue with the next agent? (Y/n): "
        );

        if (!shouldContinueOnError) {
          console.log("Stopping execution due to user request.");
          break;
        }
      }
    }

    console.log("\n🎉 ElevenLabs agent deletion process completed!");
  } catch (error) {
    console.error("❌ Error in main process:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🗑️ Starting ElevenLabs Agent Deletion Process");
  console.log("==============================================");

  let inputFilePath;

  try {
    // Check if input file was provided as command line argument
    const cmdLineInput = process.argv[2];
    if (cmdLineInput) {
      // If path is relative, resolve it relative to current working directory
      inputFilePath = path.isAbsolute(cmdLineInput)
        ? cmdLineInput
        : path.resolve(process.cwd(), cmdLineInput);
      console.log(`Using command line input file: ${inputFilePath}`);
    } else {
      // Ask user for input file
      console.log("\nNo input file provided via command line.");

      // Show available files in outputs directory
      const outputsDir = path.join(__dirname, "..", "outputs");
      let availableFiles = [];
      if (fs.existsSync(outputsDir)) {
        availableFiles = fs
          .readdirSync(outputsDir)
          .filter((file) => file.endsWith("PromptFlow.json"));
        if (availableFiles.length > 0) {
          console.log("\nAvailable PromptFlow files in outputs/ directory:");
          availableFiles.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
          });
        }
      }

      const userInput = await askUser(
        "\nPlease enter the number (1-" +
          availableFiles.length +
          ") or the path to your prompt flow JSON file: "
      );

      if (!userInput) {
        console.error("❌ No input file specified.");
        rl.close();
        process.exit(1);
      }

      // Check if user entered a number (selection from list)
      const selectedNumber = parseInt(userInput.trim());
      if (
        !isNaN(selectedNumber) &&
        selectedNumber >= 1 &&
        selectedNumber <= availableFiles.length
      ) {
        // User selected from numbered list
        const selectedFile = availableFiles[selectedNumber - 1];
        inputFilePath = path.join(outputsDir, selectedFile);
        console.log(`Selected: ${selectedFile}`);
      } else {
        // User entered a file path
        if (path.isAbsolute(userInput)) {
          inputFilePath = userInput;
        } else {
          const outputsPath = path.join(__dirname, "..", "outputs", userInput);
          const cwdPath = path.resolve(process.cwd(), userInput);

          if (fs.existsSync(outputsPath)) {
            inputFilePath = outputsPath;
          } else if (fs.existsSync(cwdPath)) {
            inputFilePath = cwdPath;
          } else {
            inputFilePath = userInput; // Let the validation below handle the error
          }
        }
      }
    }

    console.log(`\nInput file: ${inputFilePath}`);

    // Check if input file exists
    if (!fs.existsSync(inputFilePath)) {
      console.error(`❌ Input file not found: ${inputFilePath}`);
      console.error("Please ensure the file exists and the path is correct.");
      rl.close();
      process.exit(1);
    }

    console.log("Starting ElevenLabs agent deletion process...\n");

    // Process the prompt flow
    await deleteElevenLabsAgents(inputFilePath, {
      outputDir: path.join(__dirname, "..", "outputs"),
    });

    console.log("🎉 Agent deletion process completed successfully!");

    // Close readline interface and exit cleanly
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in main function:", error);
    rl.close();
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  deleteElevenLabsAgents,
  hasElevenLabsAgent,
  deleteElevenLabsAgent,
  removeAgentDataFromConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
