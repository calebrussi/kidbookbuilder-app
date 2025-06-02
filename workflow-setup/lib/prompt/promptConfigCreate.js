/**
 * Prompt configuration library for creating and updating prompt configs in promptFlow.json
 */

/**
 * Checks if a node has an empty or undefined prompt_config
 * @param {Object} node - The node to check
 * @returns {boolean} - True if prompt_config needs to be created
 */
function needsPromptConfig(node) {
  // Check if prompt_config is undefined, null, empty object, or missing
  return !node.prompt_config || Object.keys(node.prompt_config).length === 0;
}

/**
 * Checks if a node is a group node (starts with "group_")
 * @param {Object} node - The node to check
 * @returns {boolean} - True if this is a group node
 */
function isGroupNode(node) {
  return node.id && node.id.startsWith("group_");
}

/**
 * Analyzes nodes to identify those needing prompt configs
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @returns {Object} - Object containing analysis results
 */
function analyzeNodesForPromptConfig(promptFlowData) {
  // Filter nodes that need prompt configs (excluding groups and nodes with existing configs)
  const nodesToProcess = promptFlowData.filter((item) => {
    // Skip groups (they don't need prompt configs)
    if (isGroupNode(item)) {
      return false;
    }

    // Only process nodes that need prompt configs
    return needsPromptConfig(item);
  });

  const totalNodes = promptFlowData.length;
  const groupNodes = promptFlowData.filter(isGroupNode);
  const stepNodes = promptFlowData.filter((node) => !isGroupNode(node));
  const nodesWithConfigs = stepNodes.filter((node) => !needsPromptConfig(node));

  return {
    nodesToProcess,
    totalNodes,
    totalGroups: groupNodes.length,
    totalSteps: stepNodes.length,
    totalNodesToProcess: nodesToProcess.length,
    totalWithConfigs: nodesWithConfigs.length,
    groupNodes,
    stepNodes,
    nodesWithConfigs,
  };
}

/**
 * Creates a basic prompt config structure for a node
 * @param {Object} node - The node to create config for
 * @returns {Object} - Basic prompt config structure
 */
function createBasicPromptConfig(node) {
  const configName = `${node.name}_agent`;

  return {
    name: configName,
    agent: {
      first_message: node.description || `Let's talk about ${node.name}.`,
    },
    prompt: {
      prompt: `You are a helpful assistant handling the "${node.name}" step. ${
        node.description || ""
      }`,
      tools: {
        description: "End the conversation when the objective is completed.",
      },
    },
    platform_settings: {
      evaluation: {
        criteria: [
          {
            id: node.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            name: node.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            type: "prompt",
            conversation_goal_prompt: `Check if the objective for "${node.name}" has been completed.`,
          },
        ],
      },
      data_collection: {
        [node.name.toLowerCase().replace(/[^a-z0-9]/g, "_")]: {
          type: "string",
          description: `Data collected from the "${node.name}" interaction.`,
        },
      },
    },
  };
}

/**
 * Updates a node with a new prompt config
 * @param {Object} node - The node to update
 * @param {Object} promptConfig - The prompt config to add (optional, will create basic if not provided)
 * @returns {Object} - Updated node with prompt config
 */
function updateNodeWithPromptConfig(node, promptConfig = null) {
  const configToUse = promptConfig || createBasicPromptConfig(node);

  return {
    ...node,
    prompt_config: configToUse,
  };
}

/**
 * Updates all nodes that need prompt configs
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @param {Function} configGenerator - Optional function to generate custom configs
 * @returns {Object} - Object containing results and updated data
 */
function updateAllPromptConfigs(promptFlowData, configGenerator = null) {
  let updatedCount = 0;
  const updatedNodes = [];

  const updatedData = promptFlowData.map((item) => {
    if (!isGroupNode(item) && needsPromptConfig(item)) {
      const customConfig = configGenerator ? configGenerator(item) : null;
      const updatedItem = updateNodeWithPromptConfig(item, customConfig);
      updatedCount++;
      updatedNodes.push({
        id: item.id,
        name: item.name,
        description: item.description,
      });
      return updatedItem;
    }
    return item;
  });

  return {
    updatedData,
    updatedCount,
    updatedNodes,
  };
}

module.exports = {
  needsPromptConfig,
  isGroupNode,
  analyzeNodesForPromptConfig,
  createBasicPromptConfig,
  updateNodeWithPromptConfig,
  updateAllPromptConfigs,
};
