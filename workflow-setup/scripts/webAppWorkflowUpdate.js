// Node.js script to automatically update the web app workflow.js file
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");

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
 * Updates the workflow.js file with new workflow JSON data
 * @param {string} workflowJsonPath - Path to the generated workflow JSON file
 * @param {string} webAppWorkflowPath - Path to the web app workflow.js file
 * @returns {Promise<void>}
 */
async function updateWebAppWorkflow(workflowJsonPath, webAppWorkflowPath) {
  try {
    console.log(`📖 Reading workflow JSON from: ${workflowJsonPath}`);

    // Read the generated workflow JSON
    if (!fs.existsSync(workflowJsonPath)) {
      throw new Error(`Workflow JSON file not found: ${workflowJsonPath}`);
    }

    const workflowData = JSON.parse(fs.readFileSync(workflowJsonPath, "utf-8"));
    console.log(
      `✅ Successfully read workflow: ${workflowData.id || "Unknown"}`
    );

    console.log(`📖 Reading existing workflow.js from: ${webAppWorkflowPath}`);

    // Read the existing workflow.js file
    if (!fs.existsSync(webAppWorkflowPath)) {
      throw new Error(
        `Web app workflow.js file not found: ${webAppWorkflowPath}`
      );
    }

    const workflowJsContent = fs.readFileSync(webAppWorkflowPath, "utf-8");

    // Find the workflowJson object and replace it
    const workflowJsonString = JSON.stringify(workflowData, null, 2);

    // Replace the hardcoded workflowJson with the new data
    // Look for the pattern: const workflowJson = { ... };
    const workflowJsonRegex = /(const workflowJson = )({[\s\S]*?});/;

    if (!workflowJsonRegex.test(workflowJsContent)) {
      throw new Error("Could not find workflowJson object in workflow.js file");
    }

    const updatedContent = workflowJsContent.replace(
      workflowJsonRegex,
      `$1${workflowJsonString};`
    );

    // Create backup of original file
    const backupPath = webAppWorkflowPath + ".backup";
    fs.writeFileSync(backupPath, workflowJsContent);
    console.log(`💾 Created backup at: ${backupPath}`);

    // Write the updated content
    fs.writeFileSync(webAppWorkflowPath, updatedContent);
    console.log(`✅ Successfully updated workflow.js file`);
    console.log(`🔄 Restart your API server to see the changes`);
  } catch (error) {
    console.error(`❌ Error updating web app workflow:`, error.message);
    throw error;
  }
}

/**
 * Lists available workflow JSON files in the outputs directory
 * @param {string} outputDir - Path to the outputs directory
 * @returns {Array<string>} - Array of workflow JSON file names
 */
function listWorkflowFiles(outputDir) {
  if (!fs.existsSync(outputDir)) {
    return [];
  }

  return fs
    .readdirSync(outputDir)
    .filter((file) => file.endsWith("Workflow.json"))
    .sort();
}

/**
 * Main function to update web app workflow
 * @param {string} workflowJsonPath - Optional path to workflow JSON file
 * @returns {Promise<void>}
 */
async function updateWebAppWorkflowFromJson(workflowJsonPath = null) {
  const outputDir = path.join(__dirname, "..", "outputs");
  const webAppWorkflowPath = path.resolve(
    __dirname,
    "..",
    "..",
    "outputs",
    "web-app",
    "v4",
    "voice-step-flow",
    "api-server",
    "src",
    "handlers",
    "workflow.js"
  );

  try {
    let selectedWorkflowPath = workflowJsonPath;

    // If no workflow path provided, let user choose
    if (!selectedWorkflowPath) {
      const availableWorkflows = listWorkflowFiles(outputDir);

      if (availableWorkflows.length === 0) {
        console.log("❌ No workflow JSON files found in outputs directory");
        console.log(`📂 Looking in: ${outputDir}`);
        console.log(
          "🔧 Run the workflow creation scripts first to generate workflow files"
        );
        return;
      }

      console.log("\n📋 Available workflow files:");
      availableWorkflows.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });

      const choice = await askUser(
        "\nEnter the number of the workflow to use: "
      );
      const choiceIndex = parseInt(choice) - 1;

      if (choiceIndex < 0 || choiceIndex >= availableWorkflows.length) {
        throw new Error("Invalid choice");
      }

      selectedWorkflowPath = path.join(
        outputDir,
        availableWorkflows[choiceIndex]
      );
    }

    console.log(
      `\n🎯 Selected workflow: ${path.basename(selectedWorkflowPath)}`
    );
    console.log(`📂 From: ${selectedWorkflowPath}`);
    console.log(`📂 To: ${webAppWorkflowPath}`);

    const shouldContinue = await askUserToContinue(
      "\nUpdate the web app workflow.js file? "
    );

    if (!shouldContinue) {
      console.log("❌ Operation cancelled by user");
      return;
    }

    await updateWebAppWorkflow(selectedWorkflowPath, webAppWorkflowPath);
  } catch (error) {
    console.error("❌ Error in updateWebAppWorkflowFromJson:", error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🔄 Starting Web App Workflow Update Process");
  console.log("===========================================");

  try {
    // Check if workflow file path was provided as command line argument
    const cmdLineInput = process.argv[2];

    if (cmdLineInput) {
      console.log(`📁 Using workflow file: ${cmdLineInput}`);
      const workflowPath = path.resolve(cmdLineInput);
      await updateWebAppWorkflowFromJson(workflowPath);
    } else {
      await updateWebAppWorkflowFromJson();
    }

    console.log("\n🎉 Web app workflow update completed successfully!");
    console.log("🔄 Remember to restart your API server (npm run api-dev)");
  } catch (error) {
    console.error("❌ Error in main function:", error.message);
  } finally {
    rl.close();
  }
}

// Export functions for use in other modules
module.exports = {
  updateWebAppWorkflow,
  updateWebAppWorkflowFromJson,
  listWorkflowFiles,
};

// Run the script if it's called directly
if (require.main === module) {
  main().catch(console.error);
}
