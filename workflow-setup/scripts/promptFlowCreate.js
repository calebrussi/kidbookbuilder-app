// Node-to-promptflow converter using OpenRouter integration
require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the prompt flow creation functions from local lib folder
const {
  validateApiKey,
  generateOutputFileName,
  convertNodesToPromptFlow,
} = require("../lib/prompt/promptFlowCreate.js");

// Initialize OpenAI client with OpenRouter base URL
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Create outputs directory if it doesn't exist
const outputDir = path.join(__dirname, "..", "outputs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
 * Main execution function
 */
async function main() {
  try {
    console.log("🚀 Starting Nodes to Prompt Flow Conversion");
    console.log("==========================================");

    let inputFilePath;

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

      // Show available files in inputs directory
      const inputsDir = path.join(__dirname, "..", "inputs");
      let availableFiles = [];
      if (fs.existsSync(inputsDir)) {
        availableFiles = fs
          .readdirSync(inputsDir)
          .filter((file) => file.endsWith(".md"));
        if (availableFiles.length > 0) {
          console.log("\nAvailable markdown files in inputs/ directory:");
          availableFiles.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
          });
        }
      }

      const userInput = await askUser(
        "\nPlease enter the number (1-" +
          availableFiles.length +
          ") or the path to your input markdown file: "
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
        inputFilePath = path.join(inputsDir, selectedFile);
        console.log(`Selected: ${selectedFile}`);
      } else {
        // User entered a file path
        if (path.isAbsolute(userInput)) {
          inputFilePath = userInput;
        } else {
          const inputsPath = path.join(__dirname, "..", "inputs", userInput);
          const cwdPath = path.resolve(process.cwd(), userInput);

          if (fs.existsSync(inputsPath)) {
            inputFilePath = inputsPath;
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

    // Check if DEBUG mode is enabled
    if (process.env.DEBUG !== "true") {
      console.log(
        "\n💡 Debug mode is disabled. Files will not be saved to disk."
      );
      console.log("   Set DEBUG=true in your .env file to enable file output.");
      console.log(
        "   The generated JSON will still be displayed in the console.\n"
      );
    }

    // Validate API key before starting conversion
    console.log("Validating OpenRouter API access...");
    const isApiKeyValid = await validateApiKey(client);

    if (!isApiKeyValid) {
      console.error(
        "❌ OpenRouter API key validation failed. Please check your .env file and ensure OPENROUTER_API_KEY is set correctly."
      );
      rl.close();
      process.exit(1);
    }

    console.log("Starting conversion process...\n");

    // Convert using lib function
    const promptFlow = await convertNodesToPromptFlow(client, inputFilePath, {
      outputDir: outputDir,
    });

    console.log("\n🎉 Prompt flow conversion completed successfully!");
    console.log(
      `✅ Generated ${promptFlow.length || 0} nodes in the prompt flow`
    );

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
  client,
  validateApiKey: () => validateApiKey(client),
  generateOutputFileName,
  convertNodesToPromptFlow: (inputFilePath, options = {}) =>
    convertNodesToPromptFlow(client, inputFilePath, options),
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
