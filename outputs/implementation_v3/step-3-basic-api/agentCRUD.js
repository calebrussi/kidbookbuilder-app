/**
 * Complete CRUD operations for ElevenLabs agents
 * Creates, Updates, Reads, and Deletes an agent in sequence
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Import functions from other agent scripts
const { createAgent } = require("./agentCreate");
const { getAgent } = require("./agentGet");
const { listAgents } = require("./agentList");
const { updateAgent } = require("./agentUpdate");
const { deleteAgent } = require("./agentDelete");

// Default agent configuration file path
const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "input",
  "agent_create_1.json"
);

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log(`Created outputs directory: ${outputsDir}`);
}

/**
 * Execute all CRUD operations on an ElevenLabs agent
 */
async function runAgentCRUD() {
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

    // Step 4: Update the agent name
    console.log("STEP 4: UPDATING AGENT");
    const updatedName = `${agentDetails.name} Chicken`;
    console.log(`Updating agent name to: ${updatedName}...`);

    const updateConfig = {
      name: updatedName,
    };

    const updatedAgent = await updateAgent(createdAgent.agent_id, updateConfig);
    console.log(`Agent updated. New name: ${updatedAgent.name}\n`);

    // Step 5: List agents to verify update
    console.log("STEP 5: LISTING AGENTS TO VERIFY UPDATE");
    const agentListAfterUpdate = await listAgents();

    // Find our agent in the list
    const ourUpdatedAgent = agentListAfterUpdate.agents.find(
      (agent) => agent.agent_id === createdAgent.agent_id
    );

    if (ourUpdatedAgent && ourUpdatedAgent.name === updatedName) {
      console.log(`✅ Confirmed agent name was updated to "${updatedName}"\n`);
    } else if (ourUpdatedAgent) {
      console.log(
        `❌ Agent found but name was not updated correctly. Current name: ${ourUpdatedAgent.name}\n`
      );
    } else {
      console.log(
        `❌ Could not find agent ${createdAgent.agent_id} in the agent list\n`
      );
    }

    // Step 6: Get updated agent details
    console.log("STEP 6: FETCHING UPDATED AGENT DETAILS");
    console.log(
      `Fetching details for updated agent ID: ${createdAgent.agent_id}...`
    );
    const updatedAgentDetails = await getAgent(createdAgent.agent_id);
    console.log(`Updated agent name: ${updatedAgentDetails.name}\n`);

    // Step 7: Delete the agent
    console.log("STEP 7: DELETING AGENT");
    console.log(`Deleting agent with ID: ${createdAgent.agent_id}...`);
    const deleteResult = await deleteAgent(createdAgent.agent_id);
    console.log(`Agent deleted. Result: ${JSON.stringify(deleteResult)}\n`);

    // Step 8: List agents to verify deletion
    console.log("STEP 8: LISTING AGENTS TO VERIFY DELETION");
    const agentListAfterDeletion = await listAgents();

    // Check if our agent has been deleted
    const agentStillExists = agentListAfterDeletion.agents.some(
      (agent) => agent.agent_id === createdAgent.agent_id
    );

    if (!agentStillExists) {
      console.log(
        `✅ Confirmed agent ${createdAgent.agent_id} has been deleted\n`
      );
    } else {
      console.log(
        `❌ Agent ${createdAgent.agent_id} still exists in the agent list\n`
      );
    }

    console.log("===== AGENT CRUD OPERATIONS COMPLETED SUCCESSFULLY =====");
  } catch (error) {
    console.error("An error occurred during CRUD operations:", error);
  }
}

// Run the script if it's called directly
if (require.main === module) {
  runAgentCRUD();
}

// Export functions for use in other modules
module.exports = {
  runAgentCRUD,
};
