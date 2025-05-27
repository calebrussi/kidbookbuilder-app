// Node.js script to update prompt configs in a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the agent config converter from step-4 folder
const {
  convertNodeToAgentConfig,
} = require("../step-4-agent-creation/agent-config.js");

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
 * Checks if a node has an empty or undefined prompt_config
 * @param {Object} node - The node to check
 * @returns {boolean} - True if prompt_config needs to be created
 */
function needsPromptConfig(node) {
  // Check if prompt_config is undefined, null, empty object, or missing
  return !node.prompt_config || Object.keys(node.prompt_config).length === 0;
}

/**
 * Main function to process the prompt flow
 * @param {string} filePath - Path to the promptFlow.json file
 */
async function updatePromptConfigs(filePath = promptFlowFilePath) {
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

    // Filter nodes that need prompt configs (excluding groups and nodes with existing configs)
    const nodesToProcess = promptFlowData.filter((item) => {
      // Skip groups (they don't need prompt configs)
      if (item.id.startsWith("group_")) {
        return false;
      }

      // Only process nodes that need prompt configs
      return needsPromptConfig(item);
    });

    console.log(
      `Found ${nodesToProcess.length} nodes that need prompt configs`
    );

    if (nodesToProcess.length === 0) {
      console.log("All nodes already have prompt configs! Nothing to do.");
      rl.close();
      return;
    }

    // Process nodes one by one
    for (let i = 0; i < nodesToProcess.length; i++) {
      const node = nodesToProcess[i];

      console.log(
        `\n--- Processing Node ${i + 1}/${nodesToProcess.length} ---`
      );
      console.log(`Node ID: ${node.id}`);
      console.log(`Node Name: ${node.name}`);
      console.log(`Description: ${node.description}`);

      // Ask user if they want to create a prompt config for this node
      const shouldCreate = await askUserToContinue(
        `Create prompt config for "${node.name}"? (Y/n): `
      );

      if (!shouldCreate) {
        console.log("Skipping this node...");
        continue;
      }

      try {
        console.log("\nGenerating prompt config...");

        // Use the node description to generate the prompt config
        const nodeDescription = `${node.name}: ${node.description}`;

        // Generate the agent config using the existing function
        const agentConfig = await convertNodeToAgentConfig(nodeDescription, {
          outputDir: path.join(__dirname, "outputs"),
        });

        // Update the node's prompt_config
        const nodeIndex = promptFlowData.findIndex(
          (item) => item.id === node.id
        );
        if (nodeIndex !== -1) {
          promptFlowData[nodeIndex].prompt_config = agentConfig;
          console.log(`✅ Successfully updated prompt_config for ${node.name}`);
        }

        // Save the updated prompt flow back to file
        fs.writeFileSync(filePath, JSON.stringify(promptFlowData, null, 2));
        console.log(`💾 Updated prompt flow saved to: ${filePath}`);
      } catch (error) {
        console.error(
          `❌ Error generating prompt config for ${node.name}:`,
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

    console.log("\n🎉 Prompt config update process completed!");
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
  console.log("🚀 Starting Prompt Config Update Process");
  console.log("=========================================");

  // Check if a custom file path was provided as command line argument
  const customFilePath = process.argv[2];

  if (customFilePath) {
    console.log(`Using custom prompt flow file: ${customFilePath}`);
    await updatePromptConfigs(customFilePath);
  } else {
    console.log(`Using default prompt flow file: ${promptFlowFilePath}`);
    await updatePromptConfigs();
  }
}

// Export functions for use in other modules
module.exports = {
  updatePromptConfigs,
  needsPromptConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
