/**
 * Configuration clearing library for clearing ElevenLabs configs from promptFlow.json
 */

/**
 * Checks if a node has an elevenlabs_config
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config exists
 */
function hasElevenLabsConfig(node) {
  return node.elevenlabs_config && typeof node.elevenlabs_config === "object";
}

/**
 * Checks if a node has an elevenlabs_config with an agent_id
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config exists and has agent_id
 */
function hasElevenLabsAgent(node) {
  return hasElevenLabsConfig(node) && node.elevenlabs_config.agent_id;
}

/**
 * Clears the elevenlabs_config by setting it to an empty object
 * @param {Object} node - The node to update
 * @returns {Object} - The updated node
 */
function clearElevenLabsConfig(node) {
  return {
    ...node,
    elevenlabs_config: {},
  };
}

/**
 * Process nodes to identify those with configs to clear
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @returns {Object} - Object containing analysis results
 */
function analyzeNodesForClearing(promptFlowData) {
  // Filter nodes that have elevenlabs_config
  const nodesToProcess = promptFlowData.filter((item) => {
    // Skip groups (they don't need ElevenLabs configs)
    if (item.id && item.id.startsWith("group_")) {
      return false;
    }

    // Only process nodes that have elevenlabs_config
    return hasElevenLabsConfig(item);
  });

  // Separate nodes with and without agent_ids
  const nodesWithAgents = nodesToProcess.filter(hasElevenLabsAgent);
  const nodesWithoutAgents = nodesToProcess.filter(
    (node) => !hasElevenLabsAgent(node)
  );

  return {
    nodesToProcess,
    nodesWithAgents,
    nodesWithoutAgents,
    totalNodes: promptFlowData.length,
    totalNodesToProcess: nodesToProcess.length,
    totalWithAgents: nodesWithAgents.length,
    totalWithoutAgents: nodesWithoutAgents.length,
  };
}

/**
 * Clears ElevenLabs configs from all applicable nodes
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @returns {Object} - Object containing results and updated data
 */
function clearAllElevenLabsConfigs(promptFlowData) {
  let clearedCount = 0;
  const clearedNodes = [];

  const updatedData = promptFlowData.map((item) => {
    if (hasElevenLabsConfig(item)) {
      const updatedItem = clearElevenLabsConfig(item);
      clearedCount++;
      clearedNodes.push({
        id: item.id,
        name: item.name,
        hadAgentId: hasElevenLabsAgent(item),
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
  hasElevenLabsConfig,
  hasElevenLabsAgent,
  clearElevenLabsConfig,
  analyzeNodesForClearing,
  clearAllElevenLabsConfigs,
};
