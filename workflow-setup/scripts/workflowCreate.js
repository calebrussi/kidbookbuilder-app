// Node.js script to create workflow.json from a promptFlow.json file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Import the workflow creation functions from local lib folder
const {
  createWorkflowFromPromptFlow,
  validateAgentIds,
  hasElevenLabsAgent,
  groupNodesIntoSections,
  sortNodesByDependencies,
  toTitleCase,
  toKebabCase,
} = require("../lib/workflow/workflowCreate.js");

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
 * Creates a workflow.json from a promptFlow.json file
 * @param {string} inputFilePath - Path to the promptFlow.json file
 * @param {string} outputFilePath - Path where workflow.json will be saved
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The created workflow object
 */
async function createWorkflowFromPromptFlowFile(
  inputFilePath,
  outputFilePath,
  options = {}
) {
  try {
    console.log(`Reading prompt flow from: ${inputFilePath}`);

    // Check if input file exists
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`);
    }

    // Read and parse the prompt flow JSON
    const promptFlowData = JSON.parse(fs.readFileSync(inputFilePath, "utf-8"));

    if (!Array.isArray(promptFlowData)) {
      throw new Error("The prompt flow file should contain an array of nodes");
    }

    console.log(`Found ${promptFlowData.length} items in the prompt flow`);

    // Validate and create workflow using lib function
    console.log("Validating agent IDs...");
    const workflow = createWorkflowFromPromptFlow(promptFlowData, options);
    console.log("✅ All step nodes have agent_id defined");

    console.log(`Created workflow with ${workflow.sections.length} sections`);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    // Save workflow to file
    fs.writeFileSync(outputFilePath, JSON.stringify(workflow, null, 2));
    console.log(`💾 Workflow saved to: ${outputFilePath}`);

    // Display summary
    console.log("\n📋 Workflow Summary:");
    workflow.sections.forEach((section) => {
      console.log(
        `  Section: ${section.title} (${section.steps.length} steps)`
      );
      section.steps.forEach((step) => {
        console.log(`    - ${step.title} (Agent: ${step.agentId})`);
      });
    });

    return workflow;
  } catch (error) {
    console.error("❌ Error creating workflow:", error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🔄 Starting Workflow Creation Process");
  console.log("=====================================");

  let inputFilePath;
  let outputFilePath;

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

    // Generate output file path
    const inputBasename = path.basename(
      inputFilePath,
      path.extname(inputFilePath)
    );
    const outputBasename = inputBasename.replace(/PromptFlow$/, "Workflow");
    outputFilePath = path.join(
      path.dirname(inputFilePath),
      `${outputBasename}.json`
    );

    console.log(`\nInput file: ${inputFilePath}`);
    console.log(`Output file: ${outputFilePath}`);

    // Check if input file exists
    if (!fs.existsSync(inputFilePath)) {
      console.error(`❌ Input file not found: ${inputFilePath}`);
      console.error("Please ensure the file exists and the path is correct.");
      rl.close();
      process.exit(1);
    }

    // Check if output file already exists
    if (fs.existsSync(outputFilePath)) {
      const shouldOverwrite = await askUserToContinue(
        `Output file already exists. Overwrite ${outputFilePath}? (Y/n): `
      );
      if (!shouldOverwrite) {
        console.log("Operation cancelled by user.");
        rl.close();
        process.exit(0);
      }
    }

    console.log("Starting workflow creation process...\n");

    // Create the workflow
    await createWorkflowFromPromptFlowFile(inputFilePath, outputFilePath);

    console.log("\n🎉 Workflow creation completed successfully!");

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
  createWorkflowFromPromptFlowFile,
  validateAgentIds,
  hasElevenLabsAgent,
  groupNodesIntoSections,
  sortNodesByDependencies,
  toTitleCase,
  toKebabCase,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
