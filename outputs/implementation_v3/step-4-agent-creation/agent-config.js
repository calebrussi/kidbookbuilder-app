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
const outputDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Hard-coded conversation node description input
const nodeDescription =
  "What stories do you love? (favorite genres and themes)";

// Read the prompt instructions from file
const promptInstructionsPath = path.join(
  __dirname,
  "prompts/convertNodesIntoConfig_openrouter.md"
);
const promptInstructions = fs.readFileSync(promptInstructionsPath, "utf-8");

async function main() {
  try {
    console.log("Converting node description to agent config...");
    console.log(`Input: "${nodeDescription}"`);

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
      model: "openai/gpt-4o-mini", // Using GPT-4o for better JSON structuring
      messages: messages,
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
  } catch (error) {
    console.error("Error in conversion process:", error);
  }
}

main();
