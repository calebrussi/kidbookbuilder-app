// Node-to-config converter using OpenRouter integration
require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// Initialize OpenAI client with OpenRouter base URL
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Create outputs directory if it doesn't exist
const outputDir = path.join(__dirname, "..", "..", "outputs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Converts a conversation node description into an agent configuration
 * @param {string} nodeDescription - Description of conversation node/intent
 * @param {Object} options - Additional options for conversion
 * @param {string} options.model - Model to use for conversion (default: "openai/gpt-4o-mini")
 * @param {string} options.promptFilePath - Path to prompt instructions file
 * @param {string} options.outputDir - Directory to save output files
 * @returns {Promise<Object>} - The generated agent configuration
 */
async function convertNodeToAgentConfig(
  nodeDescription,
  {
    model = "openai/gpt-4o-mini",
    promptFilePath = path.join(
      __dirname,
      "..",
      "..",
      "prompts",
      "convertNodesIntoConfig.md"
    ),
    outputDir = path.join(__dirname, "outputs"),
  } = {}
) {
  try {
    console.log("Converting node description to agent config...");
    console.log(`Input: "${nodeDescription}"`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the prompt instructions from file
    const promptInstructions = fs.readFileSync(promptFilePath, "utf-8");

    // Define messages array with system prompt from instructions and user input
    const messages = [
      {
        role: "system",
        content: `${promptInstructions}\n\nFollow the instructions above to convert the user's input text description into a properly formatted agent configuration JSON.`,
      },
      {
        role: "user",
        content: nodeDescription,
      },
    ];

    const completion = await client.chat.completions.create({
      extra_headers: {
        "HTTP-Referer": "https://kidbookbuilder.app", // Optional: Site URL
        "X-Title": "Kid Book Builder", // Optional: Site title
      },
      model,
      messages,
      response_format: { type: "json_object" }, // Ensure we get valid JSON back
    });

    const agentConfig = completion.choices[0].message.content;
    console.log("Generated Agent Config:");
    console.log(agentConfig);

    // Parse the JSON to ensure validity and pretty-print it
    const parsedConfig = JSON.parse(agentConfig);

    const responseData = {
      timestamp: new Date().toISOString(),
      model: completion.model,
      input: nodeDescription,
      instructions: "Node description to agent config conversion",
      agentConfig: parsedConfig,
      fullResponse: completion,
    };

    // Save configuration files only if DEBUG is enabled
    if (process.env.DEBUG === "true") {
      const promptConfigFile = path.join(
        outputDir,
        `agent-config-response-${parsedConfig.name}.json`
      );
      fs.writeFileSync(promptConfigFile, JSON.stringify(responseData, null, 2));

      // Also save just the clean agent config for direct use
      const cleanConfigFile = path.join(
        outputDir,
        `agent-config-result-${parsedConfig.name}.json`
      );
      fs.writeFileSync(cleanConfigFile, JSON.stringify(parsedConfig, null, 2));

      console.log(`Full response saved to: ${promptConfigFile}`);
      console.log(`Clean agent config saved to: ${cleanConfigFile}`);
    } else {
      console.log(
        `Agent config generated successfully (file output disabled - set DEBUG=true to save files)`
      );
    }

    return parsedConfig;
  } catch (error) {
    console.error("Error in conversion process:", error);
    throw error;
  }
}

async function main() {
  try {
    // Hard-coded conversation node description input for direct script execution
    const nodeDescription =
      "What stories do you love? (favorite genres and themes)";

    await convertNodeToAgentConfig(nodeDescription);
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Run the script if it's called directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  convertNodeToAgentConfig,
};
