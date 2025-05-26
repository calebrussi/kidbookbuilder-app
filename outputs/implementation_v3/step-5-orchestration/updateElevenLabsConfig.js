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
function askUserToContinue(message = "Do you want to continue? (y/n): ") {
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      const response = answer.toLowerCase().trim();
      resolve(response === "y" || response === "yes");
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
 * Generates a basic ElevenLabs configuration based on node information
 * @param {Object} node - The node to generate config for
 * @returns {Object} - The ElevenLabs configuration object
 */
function generateElevenLabsConfig(node) {
  // Extract voice configuration from prompt_config if available
  const voiceId =
    node.prompt_config?.platform_settings?.voice_id || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel voice
  const agentName = node.prompt_config?.name || node.name || "default_agent";

  return {
    name: `${agentName}_elevenlabs`,
    voice_id: voiceId,
    model_id: "eleven_flash_v2",
    agent_output_audio_format: "pcm_16000",
    optimize_streaming_latency: 3,
    stability: 0.5,
    speed: 1.0,
    similarity_boost: 0.8,
    conversation_config: {
      asr: {
        quality: "high",
        provider: "elevenlabs",
        user_input_audio_format: "pcm_16000",
        keywords: [],
      },
      turn: {
        turn_timeout: 7,
        silence_end_call_timeout: 20,
        mode: "turn",
      },
      tts: {
        model_id: "eleven_flash_v2",
        voice_id: voiceId,
        agent_output_audio_format: "pcm_16000",
        optimize_streaming_latency: 3,
        stability: 0.5,
        speed: 1.0,
        similarity_boost: 0.8,
      },
    },
    platform_settings: {
      auth: {
        type: "api_key",
        required: true,
      },
      evaluation: {
        criteria: [],
      },
      data_collection: {},
    },
  };
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
        `Node ${node.name} has no prompt_config. Generating basic ElevenLabs config...`
      );
      return generateElevenLabsConfig(node);
    }

    try {
      // Convert the prompt_config to ElevenLabs format by passing it directly
      const convertResult = await convertConfig(node.prompt_config);

      // Extract only the outputConfig property if the result has that structure
      // If convertResult has an outputConfig property, use that; otherwise use the whole result
      const outputConfig = convertResult.outputConfig || convertResult;

      // Return the converted config
      return outputConfig;
    } catch (convertError) {
      console.log(
        `Conversion failed for ${node.name}: ${convertError.message}`
      );
      console.log("Generating basic ElevenLabs config instead...");
      return generateElevenLabsConfig(node);
    }
  } catch (error) {
    console.error(
      `Error creating ElevenLabs config for ${node.name}:`,
      error.message
    );
    // Fallback to basic config generation
    return generateElevenLabsConfig(node);
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
        `Create ElevenLabs config for "${node.name}"? (y/n): `
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
          promptFlowData[nodeIndex].elevenlabs_config = elevenLabsConfig;
          console.log(
            `✅ Successfully updated elevenlabs_config for ${node.name}`
          );
        }

        // Save the updated prompt flow back to file
        fs.writeFileSync(filePath, JSON.stringify(promptFlowData, null, 2));
        console.log(`💾 Updated prompt flow saved to: ${filePath}`);
      } catch (error) {
        console.error(
          `❌ Error generating ElevenLabs config for ${node.name}:`,
          error.message
        );

        const shouldContinueOnError = await askUserToContinue(
          "An error occurred. Do you want to continue with the next node? (y/n): "
        );

        if (!shouldContinueOnError) {
          console.log("Stopping execution due to user request.");
          break;
        }
      }

      // Ask if user wants to continue to the next node (unless it's the last one)
      if (i < nodesToProcess.length - 1) {
        const shouldContinue = await askUserToContinue(
          `\nContinue to next node (${i + 2}/${nodesToProcess.length})? (y/n): `
        );

        if (!shouldContinue) {
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
  generateElevenLabsConfig,
  createElevenLabsAgentConfig,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
