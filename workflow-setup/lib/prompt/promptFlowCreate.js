/**
 * Prompt flow creation library for converting markdown nodes to promptFlow.json
 */
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

/**
 * Validates that the OpenRouter API key is working
 * @param {OpenAI} client - OpenAI client instance
 * @returns {Promise<boolean>} - True if API key is valid
 */
async function validateApiKey(client) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return false;
    }

    console.log("🔍 Validating API key...");

    // Make a simple test request to validate the API key
    const testCompletion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5,
    });

    console.log("✅ API key validation successful");
    return true;
  } catch (error) {
    console.error("❌ API key validation failed:", error.message);
    return false;
  }
}

/**
 * Generates output filename from input filename
 * @param {string} inputFilePath - Path to the input file
 * @returns {string} - Generated output filename (without extension)
 */
function generateOutputFileName(inputFilePath) {
  const fileName = path.basename(inputFilePath, path.extname(inputFilePath));
  // Simply append "PromptFlow" to the original filename
  return `${fileName}PromptFlow`;
}

/**
 * Converts nodes from a markdown file into a prompt flow JSON file
 * @param {OpenAI} client - OpenAI client instance
 * @param {string} inputFilePath - Path to the input markdown file with nodes
 * @param {Object} options - Additional options for conversion
 * @param {string} options.model - Model to use for conversion (default: "openai/gpt-4o-mini")
 * @param {string} options.promptFilePath - Path to prompt instructions file
 * @param {string} options.outputDir - Directory to save output files
 * @param {string} options.outputFileName - Name for the output file (without extension)
 * @returns {Promise<Object>} - The generated prompt flow configuration
 */
async function convertNodesToPromptFlow(
  client,
  inputFilePath,
  {
    model = "openai/gpt-4o-mini",
    promptFilePath = path.join(
      __dirname,
      "..",
      "..",
      "prompts",
      "addNodesToPromptFlow.md"
    ),
    outputDir = path.join(__dirname, "..", "..", "outputs"),
    outputFileName = null,
  } = {}
) {
  try {
    // Generate output filename from input filename if not provided
    if (!outputFileName) {
      outputFileName = generateOutputFileName(inputFilePath);
    }

    console.log("Converting nodes to prompt flow...");
    console.log(`Input file: ${inputFilePath}`);
    console.log(`Output filename: ${outputFileName}`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the input markdown file
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`);
    }
    const inputContent = fs.readFileSync(inputFilePath, "utf-8");
    console.log("Input content loaded successfully");

    // Read the prompt instructions from file
    if (!fs.existsSync(promptFilePath)) {
      throw new Error(`Prompt file not found: ${promptFilePath}`);
    }
    const promptInstructions = fs.readFileSync(promptFilePath, "utf-8");
    console.log("Prompt instructions loaded successfully");

    // Define messages array with system prompt from instructions and user input
    const messages = [
      {
        role: "system",
        content: `${promptInstructions}\n\nFollow the instructions above to convert the user's input text description into a properly formatted configuration JSON.`,
      },
      {
        role: "user",
        content: inputContent,
      },
    ];

    console.log("Calling OpenRouter API...");

    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is not set in environment variables. Please check your .env file."
      );
    }

    // Add timeout wrapper for the API call
    const apiCallPromise = client.chat.completions.create({
      extra_headers: {
        "HTTP-Referer": "https://kidbookbuilder.app", // Optional: Site URL
        "X-Title": "Kid Book Builder", // Optional: Site title
      },
      model,
      messages,
      response_format: { type: "json_object" }, // Ensure we get valid JSON back
    });

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("API request timed out after 30 seconds"));
      }, 30000); // 30 second timeout
    });

    // Race between API call and timeout
    const completion = await Promise.race([apiCallPromise, timeoutPromise]);

    console.log("✅ API call completed successfully!");

    if (
      !completion.choices ||
      !completion.choices[0] ||
      !completion.choices[0].message
    ) {
      throw new Error("Invalid response format from OpenRouter API");
    }

    const promptFlowResponse = completion.choices[0].message.content;
    console.log("Generated Prompt Flow Response:");
    console.log(promptFlowResponse);

    // Parse the JSON to ensure validity
    let parsedPromptFlow;
    try {
      parsedPromptFlow = JSON.parse(promptFlowResponse);
    } catch (parseError) {
      console.error("Failed to parse JSON response from API:");
      console.error(promptFlowResponse);
      throw new Error(`Invalid JSON response from API: ${parseError.message}`);
    }

    // Flexibly extract array data from response
    let cleanPromptFlow = parsedPromptFlow;
    if (
      parsedPromptFlow &&
      typeof parsedPromptFlow === "object" &&
      !Array.isArray(parsedPromptFlow)
    ) {
      const keys = Object.keys(parsedPromptFlow);

      // If there's exactly one property and it's an array, extract it
      if (keys.length === 1) {
        const singleProperty = keys[0];
        const value = parsedPromptFlow[singleProperty];

        if (Array.isArray(value)) {
          console.log(
            `Found single property '${singleProperty}' containing an array, extracting it...`
          );
          cleanPromptFlow = value;
        }
      }
      // Fallback to specific known property names
      else if (parsedPromptFlow.json && Array.isArray(parsedPromptFlow.json)) {
        console.log(
          "Found 'json' property containing an array, extracting it..."
        );
        cleanPromptFlow = parsedPromptFlow.json;
      } else if (
        parsedPromptFlow.nodes &&
        Array.isArray(parsedPromptFlow.nodes)
      ) {
        console.log(
          "Found 'nodes' property containing an array, extracting it..."
        );
        cleanPromptFlow = parsedPromptFlow.nodes;
      }
    }

    // Create response data with metadata
    const responseData = {
      timestamp: new Date().toISOString(),
      model: completion.model,
      inputFile: inputFilePath,
      outputFileName: outputFileName,
      instructions: "Markdown nodes to prompt flow conversion",
      promptFlow: cleanPromptFlow,
      fullResponse: completion,
    };

    // Always save the clean prompt flow JSON for direct use
    const cleanPromptFlowFile = path.join(outputDir, `${outputFileName}.json`);
    fs.writeFileSync(
      cleanPromptFlowFile,
      JSON.stringify(cleanPromptFlow, null, 2)
    );
    console.log(`Clean prompt flow saved to: ${cleanPromptFlowFile}`);

    // Save full response with metadata only if DEBUG is enabled
    if (process.env.DEBUG === "true") {
      const responseFile = path.join(
        outputDir,
        `${outputFileName}-response.json`
      );
      fs.writeFileSync(responseFile, JSON.stringify(responseData, null, 2));
      console.log(`Full response saved to: ${responseFile}`);
    }

    return cleanPromptFlow;
  } catch (error) {
    console.error("❌ Error in conversion process:");

    if (error.message.includes("timed out")) {
      console.error("🕐 The API request timed out. This could be due to:");
      console.error("   - Network connectivity issues");
      console.error("   - OpenRouter API being slow or unresponsive");
      console.error("   - Large input content taking too long to process");
      console.error("   - Try again in a few moments");
    } else if (error.message.includes("API_KEY")) {
      console.error("🔑 API Key issue:");
      console.error(
        "   - Check that OPENROUTER_API_KEY is set in your .env file"
      );
      console.error("   - Verify the API key is valid and active");
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNRESET") {
      console.error("🌐 Network connection issue:");
      console.error("   - Check your internet connection");
      console.error("   - Verify OpenRouter API endpoint is accessible");
    } else {
      console.error("📋 Error details:", error.message);
    }
    throw error;
  }
}

module.exports = {
  validateApiKey,
  generateOutputFileName,
  convertNodesToPromptFlow,
};
