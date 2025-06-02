// Node.js script to clear ElevenLabs configs from a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the deleteAgent function from local lib folder
const { deleteAgent } = require("../lib/agent/agentDelete.js");

// Import the config clearing functions from local lib folder
const {
  hasElevenLabsConfig,
  hasElevenLabsAgent,
  clearElevenLabsConfig,
  analyzeNodesForClearing,
  clearAllElevenLabsConfigs,
} = require("../lib/agent/agentConfigClear.js");

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
 * Deletes an ElevenLabs agent using the node's elevenlabs_config
 * @param {Object} node - The node with elevenlabs_config containing agent_id
 * @returns {Promise<Object>} - The agent deletion response
 */
async function deleteElevenLabsAgent(node) {
  try {
    if (!hasElevenLabsAgent(node)) {
      throw new Error(
        `Node ${node.name} does not have a valid agent_id to delete`
      );
    }

    const agentId = node.elevenlabs_config.agent_id;

    console.log(`Deleting ElevenLabs agent with ID: ${agentId}...`);

    // Delete the agent using the agentDelete function
    const deletionResult = await deleteAgent(agentId);

    console.log(`✅ Successfully deleted agent with ID: ${agentId}`);

    return deletionResult;
  } catch (error) {
    console.error(`❌ Error deleting agent for ${node.name}:`, error.message);
    throw error;
  }
}

/**
 * Main function to process the prompt flow and clear configs
 * @param {string} filePath - Path to the promptFlow.json file
 * @param {Object} options - Additional options for processing
 * @param {boolean} options.deleteAgents - Whether to also delete agents from ElevenLabs
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<void>}
 */
async function clearElevenLabsConfigs(filePath, options = {}) {
  const {
    deleteAgents = false,
    outputDir = path.join(__dirname, "..", "outputs"),
  } = options;

  try {
    console.log(`Reading prompt flow from: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }

    // Read and parse the prompt flow JSON
    const promptFlowData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!Array.isArray(promptFlowData)) {
      throw new Error("The prompt flow file should contain an array of nodes");
    }

    console.log(`Found ${promptFlowData.length} items in the prompt flow`);

    // Analyze nodes using lib function
    const analysis = analyzeNodesForClearing(promptFlowData);

    console.log(`\n📊 Analysis Results:`);
    console.log(`  Total nodes: ${analysis.totalNodes}`);
    console.log(
      `  Nodes with ElevenLabs configs: ${analysis.totalNodesToProcess}`
    );
    console.log(`  Nodes with agent IDs: ${analysis.totalWithAgents}`);
    console.log(`  Nodes without agent IDs: ${analysis.totalWithoutAgents}`);

    if (analysis.totalNodesToProcess === 0) {
      console.log("✅ No ElevenLabs configs found to clear.");
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes with ElevenLabs configs:");
    analysis.nodesToProcess.forEach((node, index) => {
      const hasAgent = hasElevenLabsAgent(node)
        ? "✅ Has agent_id"
        : "⚠️  No agent_id";
      console.log(`  ${index + 1}. ${node.name} (${node.id}) - ${hasAgent}`);
    });

    // Ask for confirmation
    let confirmMessage = `\nThis will clear ElevenLabs configs from ${analysis.totalNodesToProcess} nodes.`;
    if (deleteAgents && analysis.totalWithAgents > 0) {
      confirmMessage += `\n⚠️  This will also DELETE ${analysis.totalWithAgents} agents from ElevenLabs permanently!`;
    }
    confirmMessage += `\nDo you want to continue? (Y/n): `;

    const shouldContinue = await askUserToContinue(confirmMessage);
    if (!shouldContinue) {
      console.log("Operation cancelled by user.");
      return;
    }

    // Delete agents first if requested
    if (deleteAgents && analysis.totalWithAgents > 0) {
      console.log(
        `\n🗑️  Deleting ${analysis.totalWithAgents} agents from ElevenLabs...`
      );

      for (const node of analysis.nodesWithAgents) {
        try {
          await deleteElevenLabsAgent(node);
          console.log(`  ✅ Deleted agent for ${node.name}`);
        } catch (error) {
          console.error(
            `  ❌ Failed to delete agent for ${node.name}: ${error.message}`
          );
          // Continue with other deletions
        }
      }
    }

    // Clear configs using lib function
    console.log(`\n🧹 Clearing ElevenLabs configs...`);
    const clearResults = clearAllElevenLabsConfigs(promptFlowData);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save updated data
    const outputFilePath = path.join(outputDir, path.basename(filePath));
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(clearResults.updatedData, null, 2)
    );

    console.log(`\n🎉 Config clearing completed successfully!`);
    console.log(`✅ Cleared configs from ${clearResults.clearedCount} nodes`);
    console.log(`💾 Updated file saved to: ${outputFilePath}`);

    // Display summary of cleared nodes
    console.log("\n📋 Cleared Configs Summary:");
    clearResults.clearedNodes.forEach((nodeInfo) => {
      const agentStatus = nodeInfo.hadAgentId
        ? "(had agent_id)"
        : "(no agent_id)";
      console.log(`  - ${nodeInfo.name} (${nodeInfo.id}) ${agentStatus}`);
    });
  } catch (error) {
    console.error("❌ Error in main process:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🧹 Starting ElevenLabs Config Clearing Process");
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

    // Ask if user wants to also delete agents from ElevenLabs
    const deleteAgents = await askUserToContinue(
      "\nDo you also want to DELETE the agents from ElevenLabs? (This is permanent!) (Y/n): "
    );

    console.log("Starting config clearing process...\n");

    // Clear configs and optionally delete agents
    await clearElevenLabsConfigs(inputFilePath, { deleteAgents });

    console.log("\n🎉 Config clearing completed successfully!");

    // Close readline interface and exit cleanly
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in main function:", error.message);
    rl.close();
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  clearElevenLabsConfigs,
  deleteElevenLabsAgent,
  hasElevenLabsConfig,
  hasElevenLabsAgent,
  clearElevenLabsConfig,
  analyzeNodesForClearing,
  clearAllElevenLabsConfigs,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
