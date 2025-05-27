// Node.js script to update ElevenLabs configs in a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the agent convert and create functions from step-4 folder
const { convertConfig } = require("../step-4-agent-creation/agent-convert.js");

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
 * Checks if a node has an empty or undefined elevenlabs_config
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config needs to be created
 */
function needsElevenLabsConfig(node) {
  // Check if elevenlabs_config is undefined, null, empty object, or missing
  return (
    !node.elevenlabs_config || Object.keys(node.elevenlabs_config).length === 0
  );
}

/**
 * Creates an ElevenLabs agent config using the convert and create process
 * @param {Object} node - The node to create ElevenLabs config for
 * @param {Object} options - Options for config creation
 * @returns {Promise<Object>} - The generated ElevenLabs configuration
 */
async function createElevenLabsAgentConfig(node, options = {}) {
  try {
    // Check if node has prompt_config to use as base
    if (!node.prompt_config || Object.keys(node.prompt_config).length === 0) {
      console.log(
        `Node ${node.name} has no prompt_config. Continuing with next node...`
      );
      return {};
    }

    try {
      const OUTPUT_PATH = path.join(
        __dirname,
        "outputs",
        `agent-convert-result-${node.name}.json`
      );

      // Convert the prompt_config to ElevenLabs format by passing it directly
      const convertResult = await convertConfig({
        inputObj: node.prompt_config,
        outputPath: OUTPUT_PATH,
      });

      // Extract only the outputConfig property if the result has that structure
      // If convertResult has an outputConfig property, use that; otherwise use the whole result
      const outputConfig = convertResult.outputConfig || convertResult;

      // Return the converted config
      return outputConfig;
    } catch (convertError) {
      console.log(
        `Conversion failed for ${node.name}: ${convertError.message}`
      );
      return {};
    }
  } catch (error) {
    console.error(
      `Error creating ElevenLabs config for ${node.name}:`,
      error.message
    );
    // Fallback to basic config generation
    return {};
  }
}

/**
 * Main function to process the prompt flow
 * @param {string} filePath - Path to the promptFlow.json file
 */
async function updateElevenLabsConfigs(filePath = promptFlowFilePath) {
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

    // Filter nodes that need ElevenLabs configs (excluding groups and nodes with existing configs)
    const nodesToProcess = promptFlowData.filter((item) => {
      // Skip groups (they don't need ElevenLabs configs)
      if (item.id.startsWith("group_")) {
        return false;
      }

      // Only process nodes that need ElevenLabs configs
      return needsElevenLabsConfig(item);
    });

    console.log(
      `Found ${nodesToProcess.length} nodes that need ElevenLabs configs`
    );

    if (nodesToProcess.length === 0) {
      console.log("All nodes already have ElevenLabs configs! Nothing to do.");
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

      // Ask user if they want to create an ElevenLabs config for this node
      const shouldCreate = await askUserToContinue(
        `Create ElevenLabs config for "${node.name}"? (Y/n): `
      );

      if (!shouldCreate) {
        console.log("Skipping this node...");
        continue;
      }

      try {
        console.log("\nGenerating ElevenLabs config...");

        // Generate the ElevenLabs config
        const elevenLabsConfig = await createElevenLabsAgentConfig(node, {
          outputDir: path.join(__dirname, "outputs"),
        });

        // Update the node's elevenlabs_config
        const nodeIndex = promptFlowData.findIndex(
          (item) => item.id === node.id
        );
        if (nodeIndex !== -1) {
          // Check if the config has properties before considering it successful
          if (elevenLabsConfig && Object.keys(elevenLabsConfig).length > 0) {
            promptFlowData[nodeIndex].elevenlabs_config = elevenLabsConfig;
            console.log(
              `✅ Successfully updated elevenlabs_config for ${node.name}`
            );

            // Save the updated prompt flow back to file
            fs.writeFileSync(filePath, JSON.stringify(promptFlowData, null, 2));
            console.log(`💾 Updated prompt flow saved to: ${filePath}`);
          } else {
            console.log(
              `❌ Failed to create elevenlabs_config for ${node.name} - no properties found in the config`
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Error generating ElevenLabs config for ${node.name}:`,
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

    console.log("\n🎉 ElevenLabs config update process completed!");
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
  console.log("🚀 Starting ElevenLabs Config Update Process");
  console.log("============================================");

  // Check if a custom file path was provided as command line argument
  const customFilePath = process.argv[2];

  if (customFilePath) {
    console.log(`Using custom prompt flow file: ${customFilePath}`);
    await updateElevenLabsConfigs(customFilePath);
  } else {
    console.log(`Using default prompt flow file: ${promptFlowFilePath}`);
    await updateElevenLabsConfigs();
  }
}

// Export functions for use in other modules
module.exports = {
  updateElevenLabsConfigs,
  needsElevenLabsConfig,
  createElevenLabsAgentConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
