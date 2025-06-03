// Node.js script to clear prompt configs from a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the config clearing functions from local lib folder
const {
  hasPromptConfig,
  clearPromptConfig,
  analyzeNodesForClearing,
  clearAllPromptConfigs,
} = require("../lib/prompt/promptConfigClear.js");

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
 * Main function to process the prompt flow and clear configs
 * @param {string} filePath - Path to the promptFlow.json file
 * @param {Object} options - Additional options for processing
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<void>}
 */
async function clearPromptConfigs(filePath, options = {}) {
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
    const analysis = analyzeNodesForClearing(promptFlowData);

    console.log(`\n📊 Analysis Results:`);
    console.log(`  Total nodes: ${analysis.totalNodes}`);
    console.log(`  Nodes with prompt configs: ${analysis.totalNodesToProcess}`);

    if (analysis.totalNodesToProcess === 0) {
      console.log("✅ No prompt configs found to clear.");
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes with prompt configs:");
    analysis.nodesToProcess.forEach((node, index) => {
      console.log(`  ${index + 1}. ${node.name} (${node.id})`);
    });

    // Process nodes one by one with individual confirmation
    console.log(`\n🧹 Processing prompt configs...`);
    const clearedNodes = [];
    let clearedCount = 0;

    // Create a copy of the prompt flow data to modify
    const updatedData = [...promptFlowData];

    for (let i = 0; i < analysis.nodesToProcess.length; i++) {
      const node = analysis.nodesToProcess[i];

      console.log(`\n--- Node ${i + 1} of ${analysis.totalNodesToProcess} ---`);
      console.log(`Name: ${node.name}`);
      console.log(`ID: ${node.id}`);

      // Show current prompt config (first few lines for preview)
      if (node.prompt_config && Object.keys(node.prompt_config).length > 0) {
        console.log(
          `Current prompt config: ${JSON.stringify(
            node.prompt_config,
            null,
            2
          ).substring(0, 200)}${
            Object.keys(node.prompt_config).length > 0 &&
            JSON.stringify(node.prompt_config, null, 2).length > 200
              ? "..."
              : ""
          }`
        );
      }

      const shouldClearThisNode = await askUserToContinue(
        `Clear prompt config for "${node.name}"? (Y/n): `
      );

      if (shouldClearThisNode) {
        // Find the node in the updatedData array and clear its config
        const nodeIndex = updatedData.findIndex((item) => item.id === node.id);
        if (nodeIndex !== -1) {
          updatedData[nodeIndex] = clearPromptConfig(updatedData[nodeIndex]);
          clearedNodes.push({
            id: node.id,
            name: node.name,
          });
          clearedCount++;
          console.log(`  ✅ Cleared prompt config for "${node.name}"`);
        }
      } else {
        console.log(`  ⏭️  Skipped "${node.name}"`);
      }
    }

    const clearResults = {
      updatedData,
      clearedCount,
      clearedNodes,
    };

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save updated data only if changes were made
    const outputFilePath = path.join(outputDir, path.basename(filePath));
    if (clearResults.clearedCount > 0) {
      fs.writeFileSync(
        outputFilePath,
        JSON.stringify(clearResults.updatedData, null, 2)
      );
    }

    console.log(`\n🎉 Config clearing process completed!`);
    if (clearResults.clearedCount > 0) {
      console.log(`✅ Cleared configs from ${clearResults.clearedCount} nodes`);
      console.log(`💾 Updated file saved to: ${outputFilePath}`);

      // Display summary of cleared nodes
      console.log("\n📋 Cleared Configs Summary:");
      clearResults.clearedNodes.forEach((nodeInfo) => {
        console.log(`  - ${nodeInfo.name} (${nodeInfo.id})`);
      });
    } else {
      console.log(`ℹ️  No configs were cleared (all nodes were skipped)`);
      console.log(`💾 No changes made to the file`);
    }

    const skippedCount =
      analysis.totalNodesToProcess - clearResults.clearedCount;
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
  console.log("🧹 Starting Prompt Config Clearing Process");
  console.log("==========================================");

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

    console.log("Starting config clearing process...\n");

    // Clear configs
    await clearPromptConfigs(inputFilePath);

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
  clearPromptConfigs,
  hasPromptConfig,
  clearPromptConfig,
  analyzeNodesForClearing,
  clearAllPromptConfigs,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
