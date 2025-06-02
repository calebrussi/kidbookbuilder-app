// Node.js script to update ElevenLabs configs in a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the agent convert function from local lib folder
const { convertConfig } = require("../lib/agent/agent-convert.js");

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
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<Object>} - The generated ElevenLabs configuration
 */
async function createElevenLabsAgentConfig(node, options = {}) {
  const { outputDir = path.join(__dirname, "..", "outputs") } = options;

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
        outputDir,
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
 * @param {Object} options - Additional options for processing
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<void>}
 */
async function updateElevenLabsConfigs(filePath, options = {}) {
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
      return;
    }

    // Show summary of nodes to process
    console.log("\n📋 Nodes to process:");
    nodesToProcess.forEach((node, index) => {
      console.log(`  ${index + 1}. ${node.name} (${node.id})`);
    });

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
          outputDir,
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
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 Starting ElevenLabs Config Update Process");
  console.log("============================================");

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

    console.log("Starting ElevenLabs config update process...\n");

    // Process the prompt flow
    await updateElevenLabsConfigs(inputFilePath, {
      outputDir: path.join(__dirname, "..", "outputs"),
    });

    console.log("🎉 Update process completed successfully!");

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
  updateElevenLabsConfigs,
  needsElevenLabsConfig,
  createElevenLabsAgentConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
