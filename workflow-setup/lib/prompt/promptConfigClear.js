/**
 * Configuration clearing library for clearing prompt_config from promptFlow.json
 */

/**
 * Checks if a node has a prompt_config
 * @param {Object} node - The node to check
 * @returns {boolean} - True if prompt_config exists
 */
function hasPromptConfig(node) {
  return node.prompt_config && typeof node.prompt_config === "object";
}

/**
 * Clears the prompt_config by setting it to an empty object
 * @param {Object} node - The node to update
 * @returns {Object} - The updated node
 */
function clearPromptConfig(node) {
  return {
    ...node,
    prompt_config: {},
  };
}

/**
 * Process nodes to identify those with prompt configs to clear
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @returns {Object} - Object containing analysis results
 */
function analyzeNodesForClearing(promptFlowData) {
  // Filter nodes that have prompt_config
  const nodesToProcess = promptFlowData.filter((item) => {
    // Skip groups (they don't need prompt configs)
    if (item.id && item.id.startsWith("group_")) {
      return false;
    }

    // Only process nodes that have prompt_config
    return hasPromptConfig(item);
  });

  return {
    nodesToProcess,
    totalNodes: promptFlowData.length,
    totalNodesToProcess: nodesToProcess.length,
  };
}

/**
 * Clears prompt configs from all applicable nodes
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @returns {Object} - Object containing results and updated data
 */
function clearAllPromptConfigs(promptFlowData) {
  let clearedCount = 0;
  const clearedNodes = [];

  const updatedData = promptFlowData.map((item) => {
    if (hasPromptConfig(item)) {
      const updatedItem = clearPromptConfig(item);
      clearedCount++;
      clearedNodes.push({
        id: item.id,
        name: item.name,
      });
      return updatedItem;
    }
    return item;
  });

  return {
    updatedData,
    clearedCount,
    clearedNodes,
  };
}

module.exports = {
  hasPromptConfig,
  clearPromptConfig,
  analyzeNodesForClearing,
  clearAllPromptConfigs,
};
