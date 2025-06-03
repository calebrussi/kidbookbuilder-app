// Node.js script to update prompt configs in a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the agent config converter from local lib folder
const { convertNodeToAgentConfig } = require("../lib/agent/agent-config.js");

// Import the prompt config functions from local lib folder
const {
  needsPromptConfig,
  isGroupNode,
  analyzeNodesForPromptConfig,
  createBasicPromptConfig,
  updateNodeWithPromptConfig,
  updateAllPromptConfigs,
} = require("../lib/prompt/promptConfigCreate.js");

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
 * Main function to process the prompt flow
 * @param {string} filePath - Path to the promptFlow.json file
 * @param {Object} options - Additional options for processing
 * @param {string} options.outputDir - Directory to save output files
 * @param {boolean} options.useAdvancedConfig - Whether to use the advanced agent config converter
 * @returns {Promise<void>}
 */
async function updatePromptConfigs(filePath, options = {}) {
  const {
    outputDir = path.join(__dirname, "..", "outputs"),
    useAdvancedConfig = false,
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
    const analysis = analyzeNodesForPromptConfig(promptFlowData);

    console.log(`\n📊 Analysis Results:`);
    console.log(`  Total nodes: ${analysis.totalNodes}`);
    console.log(`  Group nodes: ${analysis.totalGroups}`);
    console.log(`  Step nodes: ${analysis.totalSteps}`);
    console.log(
      `  Nodes needing prompt configs: ${analysis.totalNodesToProcess}`
    );
    console.log(`  Nodes with existing configs: ${analysis.totalWithConfigs}`);

    if (analysis.totalNodesToProcess === 0) {
      console.log("✅ All step nodes already have prompt configs.");
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes needing prompt configs:");
    analysis.nodesToProcess.forEach((node, index) => {
      console.log(
        `  ${index + 1}. ${node.name} (${node.id}) - ${
          node.description || "No description"
        }`
      );
    });

    // Choose configuration method
    let configGenerator = null;
    if (useAdvancedConfig) {
      console.log("🤖 Using advanced agent config converter...");
      configGenerator = async (node) => {
        try {
          // Create a proper description string from the node
          const nodeDescription = `${node.name}: ${
            node.description || "No description provided"
          }`;
          return await convertNodeToAgentConfig(nodeDescription);
        } catch (error) {
          console.warn(
            `⚠️  Advanced config failed for ${node.name}, using basic config: ${error.message}`
          );
          return createBasicPromptConfig(node);
        }
      };
    } else {
      console.log("🔧 Using basic prompt config generator...");
    }

    // Process nodes one by one with individual confirmation
    console.log(`\n🔄 Processing prompt configs...`);
    const updatedNodes = [];
    let updatedCount = 0;

    // Create a copy of the prompt flow data to modify
    const updatedData = [...promptFlowData];

    for (let i = 0; i < analysis.nodesToProcess.length; i++) {
      const node = analysis.nodesToProcess[i];

      console.log(`\n--- Node ${i + 1} of ${analysis.totalNodesToProcess} ---`);
      console.log(`Name: ${node.name}`);
      console.log(`ID: ${node.id}`);
      console.log(`Description: ${node.description || "No description"}`);

      // Show current prompt config status
      if (node.prompt_config && Object.keys(node.prompt_config).length > 0) {
        console.log(`Current prompt config: Has existing config`);
      } else {
        console.log(`Current prompt config: No config (will create new)`);
      }

      const shouldCreateConfigForThisNode = await askUserToContinue(
        `Create prompt config for "${node.name}"? (Y/n): `
      );

      if (shouldCreateConfigForThisNode) {
        console.log(`  🔄 Processing ${node.name}...`);

        try {
          let customConfig = null;
          if (configGenerator) {
            customConfig = await configGenerator(node);
          }

          // Find the node in the updatedData array and update its config
          const nodeIndex = updatedData.findIndex(
            (item) => item.id === node.id
          );
          if (nodeIndex !== -1) {
            const updatedItem = updateNodeWithPromptConfig(
              updatedData[nodeIndex],
              customConfig
            );
            updatedData[nodeIndex] = updatedItem;
            updatedNodes.push({
              id: node.id,
              name: node.name,
              description: node.description,
            });
            updatedCount++;
            console.log(`  ✅ Created prompt config for "${node.name}"`);
          }
        } catch (error) {
          console.error(`  ❌ Error processing ${node.name}:`, error.message);
          // Use basic config as fallback
          try {
            const nodeIndex = updatedData.findIndex(
              (item) => item.id === node.id
            );
            if (nodeIndex !== -1) {
              const updatedItem = updateNodeWithPromptConfig(
                updatedData[nodeIndex],
                null
              );
              updatedData[nodeIndex] = updatedItem;
              updatedNodes.push({
                id: node.id,
                name: node.name,
                description: node.description,
              });
              updatedCount++;
              console.log(
                `  ⚠️  Used basic config for "${node.name}" due to error`
              );
            }
          } catch (fallbackError) {
            console.error(
              `  ❌ Fallback also failed for ${node.name}:`,
              fallbackError.message
            );
          }
        }
      } else {
        console.log(`  ⏭️  Skipped "${node.name}"`);
      }
    }

    const updateResults = {
      updatedData,
      updatedCount,
      updatedNodes,
    };

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save updated data only if changes were made
    const outputFilePath = path.join(outputDir, path.basename(filePath));
    if (updateResults.updatedCount > 0) {
      fs.writeFileSync(
        outputFilePath,
        JSON.stringify(updateResults.updatedData, null, 2)
      );
    }

    console.log(`\n🎉 Prompt config update process completed!`);
    if (updateResults.updatedCount > 0) {
      console.log(`✅ Created configs for ${updateResults.updatedCount} nodes`);
      console.log(`💾 Updated file saved to: ${outputFilePath}`);

      // Display summary of updated nodes
      console.log("\n📋 Updated Nodes Summary:");
      updateResults.updatedNodes.forEach((nodeInfo) => {
        console.log(`  - ${nodeInfo.name} (${nodeInfo.id})`);
        if (nodeInfo.description) {
          console.log(`    Description: ${nodeInfo.description}`);
        }
      });
    } else {
      console.log(`ℹ️  No configs were created (all nodes were skipped)`);
      console.log(`💾 No changes made to the file`);
    }

    const skippedCount =
      analysis.totalNodesToProcess - updateResults.updatedCount;
    if (skippedCount > 0) {
      console.log(`⏭️  Skipped ${skippedCount} nodes`);
    }
  } catch (error) {
    console.error("❌ Error in main process:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 Starting Prompt Config Update Process");
  console.log("=========================================");

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

    // Ask if user wants to use advanced config generation
    const useAdvancedConfig = await askUserToContinue(
      "\nUse advanced agent config converter? (This uses the agent-config lib) (Y/n): "
    );

    console.log("Starting prompt config update process...\n");

    // Update prompt configs
    await updatePromptConfigs(inputFilePath, { useAdvancedConfig });

    console.log("\n🎉 Prompt config update process completed!");

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
  updatePromptConfigs,
  needsPromptConfig,
  isGroupNode,
  analyzeNodesForPromptConfig,
  createBasicPromptConfig,
  updateNodeWithPromptConfig,
  updateAllPromptConfigs,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
