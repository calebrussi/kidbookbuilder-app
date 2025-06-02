// Node.js script to create ElevenLabs agents and update their configs in a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the createAgent function from local lib folder
const { createAgent } = require("../lib/agent/agentCreate.js");

// Import the agent creation config functions from local lib folder
const {
  hasValidElevenLabsConfig,
  hasAgentCreationData,
  isGroupNode,
  analyzeNodesForAgentCreation,
  appendAgentResponseToConfig,
  updateNodeWithAgentData,
  updateAllNodesWithAgentData,
} = require("../lib/agent/agentCreateConfig.js");

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
 * Creates an ElevenLabs agent using the node's elevenlabs_config
 * @param {Object} node - The node with elevenlabs_config to create agent from
 * @returns {Promise<Object>} - The agent creation response
 */
async function createElevenLabsAgent(node) {
  try {
    if (!hasValidElevenLabsConfig(node)) {
      throw new Error(
        `Node ${node.name} does not have a valid elevenlabs_config for agent creation`
      );
    }

    console.log(`Creating ElevenLabs agent for: ${node.name}...`);

    // Create the agent using the agentCreate function
    const agentResponse = await createAgent(node.elevenlabs_config);

    console.log(
      `✅ Successfully created agent for ${node.name} with ID: ${agentResponse.agent_id}`
    );

    return agentResponse;
  } catch (error) {
    console.error(`❌ Error creating agent for ${node.name}:`, error.message);
    throw error;
  }
}

/**
 * Main function to process the prompt flow and create agents
 * @param {string} filePath - Path to the promptFlow.json file
 * @param {Object} options - Additional options for processing
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<void>}
 */
async function createElevenLabsAgents(filePath, options = {}) {
  const { outputDir = path.join(__dirname, "..", "outputs") } = options;

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
    const analysis = analyzeNodesForAgentCreation(promptFlowData);

    console.log(`\n📊 Analysis Results:`);
    console.log(`  Total nodes: ${analysis.totalNodes}`);
    console.log(`  Group nodes: ${analysis.totalGroups}`);
    console.log(`  Step nodes: ${analysis.totalSteps}`);
    console.log(`  Nodes with valid configs: ${analysis.totalWithConfigs}`);
    console.log(`  Nodes with existing agents: ${analysis.totalWithAgents}`);
    console.log(`  Nodes without configs: ${analysis.totalWithoutConfigs}`);
    console.log(
      `  Nodes ready for agent creation: ${analysis.totalNodesToProcess}`
    );

    if (analysis.totalNodesToProcess === 0) {
      if (analysis.totalWithAgents > 0) {
        console.log("✅ All nodes that can have agents already have them.");
      } else {
        console.log(
          "⚠️  No nodes have valid ElevenLabs configs for agent creation."
        );
        console.log("   Run the agent config creation process first.");
      }
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes ready for agent creation:");
    analysis.nodesToProcess.forEach((node, index) => {
      console.log(
        `  ${index + 1}. ${node.name} (${node.id}) - Config: ${
          node.elevenlabs_config.name
        }`
      );
    });

    if (analysis.totalWithoutConfigs > 0) {
      console.log("\n⚠️  Nodes without ElevenLabs configs:");
      analysis.nodesWithoutConfigs.forEach((node) => {
        console.log(`  - ${node.name} (${node.id})`);
      });
      console.log(
        "   Consider running the agent config creation process for these nodes first."
      );
    }

    // Ask for confirmation
    const confirmMessage = `\nThis will create ${analysis.totalNodesToProcess} new agents in ElevenLabs. Do you want to continue? (Y/n): `;
    const shouldContinue = await askUserToContinue(confirmMessage);
    if (!shouldContinue) {
      console.log("Operation cancelled by user.");
      return;
    }

    // Create agents one by one with progress updates
    console.log(`\n🤖 Creating ${analysis.totalNodesToProcess} agents...`);

    const agentResponses = [];

    for (let i = 0; i < analysis.nodesToProcess.length; i++) {
      const node = analysis.nodesToProcess[i];
      try {
        console.log(
          `\n[${i + 1}/${analysis.totalNodesToProcess}] Creating agent for ${
            node.name
          }...`
        );
        const agentResponse = await createElevenLabsAgent(node);

        agentResponses.push({
          nodeId: node.id,
          nodeName: node.name,
          agentData: agentResponse,
          success: true,
        });

        console.log(`  ✅ Agent created with ID: ${agentResponse.agent_id}`);

        // Add a small delay to avoid rate limiting
        if (i < analysis.nodesToProcess.length - 1) {
          console.log("  ⏳ Waiting 1 second to avoid rate limiting...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `  ❌ Failed to create agent for ${node.name}: ${error.message}`
        );
        agentResponses.push({
          nodeId: node.id,
          nodeName: node.name,
          error: error.message,
          success: false,
        });
        // Continue with other agents
      }
    }

    // Update nodes with agent data using lib function
    console.log(`\n📝 Updating nodes with agent data...`);
    const successfulResponses = agentResponses.filter((r) => r.success);
    const updateResults = updateAllNodesWithAgentData(
      promptFlowData,
      successfulResponses
    );

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save updated data
    const outputFilePath = path.join(outputDir, path.basename(filePath));
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(updateResults.updatedData, null, 2)
    );

    // Summary
    const successCount = agentResponses.filter((r) => r.success).length;
    const failureCount = agentResponses.filter((r) => !r.success).length;

    console.log(`\n🎉 Agent creation process completed!`);
    console.log(`✅ Successfully created: ${successCount} agents`);
    if (failureCount > 0) {
      console.log(`❌ Failed to create: ${failureCount} agents`);
    }
    console.log(
      `📝 Updated: ${updateResults.updatedCount} nodes with agent data`
    );
    console.log(`💾 Updated file saved to: ${outputFilePath}`);

    // Display summary of created agents
    console.log("\n📋 Agent Creation Summary:");
    agentResponses.forEach((response) => {
      if (response.success) {
        console.log(
          `  ✅ ${response.nodeName}: ${response.agentData.agent_id}`
        );
      } else {
        console.log(`  ❌ ${response.nodeName}: ${response.error}`);
      }
    });
  } catch (error) {
    console.error("❌ Error in main process:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 Starting ElevenLabs Agent Creation Process");
  console.log("=============================================");

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

    console.log("Starting agent creation process...\n");

    // Create ElevenLabs agents
    await createElevenLabsAgents(inputFilePath);

    console.log("\n🎉 Agent creation process completed!");

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
  createElevenLabsAgents,
  createElevenLabsAgent,
  hasValidElevenLabsConfig,
  hasAgentCreationData,
  appendAgentResponseToConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
