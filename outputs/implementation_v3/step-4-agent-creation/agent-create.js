/**
 * Complete CRUD operations for ElevenLabs agents
 * Creates, Updates, Reads, and Deletes an agent in sequence
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Flag to determine if the agent should be deleted after creation
// Set to false if you want to keep the agent after running the script
const DELETE_AGENT_AFTER_CREATION = false;

// Import functions from other agent scripts
const { createAgent } = require("../step-3-basic-api/agentCreate");
const { getAgent } = require("../step-3-basic-api/agentGet");
const { listAgents } = require("../step-3-basic-api/agentList");
const { deleteAgent } = require("../step-3-basic-api/agentDelete");

// Default agent configuration file path
const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "outputs",
  "agent-convert-result-story_genre_selection_agent.json"
);

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

/**
 * Execute a test create of an ElevenLabs agent (then optionally delete it)
 * @param {boolean} deleteAgent - Override whether to delete the agent after creation (optional)
 */
async function runAgentCreate(deleteAgent = DELETE_AGENT_AFTER_CREATION) {
  // Set the delete flag based on the parameter (allows for overriding when calling from another module)
  const shouldDeleteAgent = deleteAgent;
  try {
    // Check for API key
    const API_KEY = process.env.ELEVEN_LABS_API_KEY;
    if (!API_KEY) {
      console.error(
        "Error: API key is required. Please set the ELEVEN_LABS_API_KEY environment variable in .env file"
      );
      process.exit(1);
    }

    console.log("===== BEGINNING AGENT CRUD OPERATIONS =====\n");

    // Step 1: Create the agent
    console.log("STEP 1: CREATING AGENT");
    console.log(`Reading agent configuration from: ${DEFAULT_CONFIG_PATH}...`);

    // Read and parse the configuration file
    const agentConfig = JSON.parse(
      fs.readFileSync(DEFAULT_CONFIG_PATH, "utf8")
    );

    // Update the agent name to prepend "test_" before sending to API
    agentConfig.name = `test_${agentConfig.name}`;
    console.log(`Creating agent with name: ${agentConfig.name}...`);

    const createdAgent = await createAgent(agentConfig);
    console.log(`Agent created with ID: ${createdAgent.agent_id}\n`);

    // Step 2: List agents to verify creation
    console.log("STEP 2: LISTING AGENTS TO VERIFY CREATION");
    const agentListAfterCreation = await listAgents();
    console.log(`Found ${agentListAfterCreation.agents.length} agents`);

    // Check if our agent exists in the list
    const createdAgentExists = agentListAfterCreation.agents.some(
      (agent) => agent.agent_id === createdAgent.agent_id
    );

    if (createdAgentExists) {
      console.log(
        `✅ Confirmed agent ${createdAgent.agent_id} exists in the agent list\n`
      );
    } else {
      console.log(
        `❌ Could not find agent ${createdAgent.agent_id} in the agent list\n`
      );
    }

    // Step 3: Get agent details
    console.log("STEP 3: FETCHING AGENT DETAILS");
    console.log(`Fetching details for agent ID: ${createdAgent.agent_id}...`);
    const agentDetails = await getAgent(createdAgent.agent_id);
    console.log(`Original agent name: ${agentDetails.name}\n`);

    // Step 4: Delete the agent (if flag is set to true)
    if (shouldDeleteAgent) {
      console.log("STEP 4: DELETING AGENT");
      console.log(`Deleting agent with ID: ${createdAgent.agent_id}...`);
      const deleteResult = await deleteAgent(createdAgent.agent_id);
      console.log(`Agent deleted. Result: ${JSON.stringify(deleteResult)}\n`);
    } else {
      console.log("STEP 4: SKIPPING AGENT DELETION");
      console.log(
        `Agent with ID ${createdAgent.agent_id} was not deleted as agent deletion is disabled\n`
      );
    }

    console.log("===== AGENT CRUD OPERATIONS COMPLETED SUCCESSFULLY =====");
  } catch (error) {
    console.error("An error occurred during CRUD operations:", error);
  }
}

/**
 * Parse command line arguments
 * @returns {Object} Command line arguments
 */
function parseCommandLineArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg === "--keep-agent") {
      args.keepAgent = true;
    }
  });
  return args;
}

// Run the script if it's called directly
if (require.main === module) {
  const args = parseCommandLineArgs();
  // Override DELETE_AGENT_AFTER_CREATION if --keep-agent flag is passed
  if (args.keepAgent) {
    global.DELETE_AGENT_AFTER_CREATION = false;
  }
  runAgentCreate();
}

// Export functions for use in other modules
module.exports = {
  runAgentCreate,
};
