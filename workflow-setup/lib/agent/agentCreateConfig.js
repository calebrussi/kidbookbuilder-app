/**
 * Agent creation configuration library for creating ElevenLabs agents from promptFlow configs
 */

/**
 * Checks if a node has an elevenlabs_config that can be used to create an agent
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config exists and has required fields
 */
function hasValidElevenLabsConfig(node) {
  return (
    node.elevenlabs_config &&
    typeof node.elevenlabs_config === "object" &&
    Object.keys(node.elevenlabs_config).length > 0 &&
    node.elevenlabs_config.name
  );
}

/**
 * Checks if the elevenlabs_config already has agent creation response data
 * @param {Object} node - The node to check
 * @returns {boolean} - True if agent_id or agent creation data exists
 */
function hasAgentCreationData(node) {
  return (
    node.elevenlabs_config &&
    (node.elevenlabs_config.agent_id || node.elevenlabs_config.created_agent)
  );
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
 * Analyzes nodes to identify those ready for agent creation
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @returns {Object} - Object containing analysis results
 */
function analyzeNodesForAgentCreation(promptFlowData) {
  // Filter nodes that have valid elevenlabs_config for agent creation
  const nodesToProcess = promptFlowData.filter((item) => {
    // Skip groups (they don't need agents)
    if (isGroupNode(item)) {
      return false;
    }

    // Only process nodes that have valid elevenlabs_config but no agent yet
    return hasValidElevenLabsConfig(item) && !hasAgentCreationData(item);
  });

  const totalNodes = promptFlowData.length;
  const groupNodes = promptFlowData.filter(isGroupNode);
  const stepNodes = promptFlowData.filter((node) => !isGroupNode(node));
  const nodesWithConfigs = stepNodes.filter(hasValidElevenLabsConfig);
  const nodesWithAgents = stepNodes.filter(hasAgentCreationData);
  const nodesWithoutConfigs = stepNodes.filter(
    (node) => !hasValidElevenLabsConfig(node)
  );

  return {
    nodesToProcess,
    totalNodes,
    totalGroups: groupNodes.length,
    totalSteps: stepNodes.length,
    totalNodesToProcess: nodesToProcess.length,
    totalWithConfigs: nodesWithConfigs.length,
    totalWithAgents: nodesWithAgents.length,
    totalWithoutConfigs: nodesWithoutConfigs.length,
    groupNodes,
    stepNodes,
    nodesWithConfigs,
    nodesWithAgents,
    nodesWithoutConfigs,
  };
}

/**
 * Appends agent creation response to the node's elevenlabs_config
 * @param {Object} node - The node to update
 * @param {Object} agentResponse - The agent creation response
 * @returns {Object} - The updated elevenlabs_config
 */
function appendAgentResponseToConfig(node, agentResponse) {
  const updatedConfig = {
    agent_id: agentResponse.agent_id,
    created_at: new Date().toISOString(),
    ...node.elevenlabs_config,
  };

  return updatedConfig;
}

/**
 * Updates a node with agent creation response data
 * @param {Object} node - The node to update
 * @param {Object} agentResponse - The agent creation response
 * @returns {Object} - Updated node with agent data
 */
function updateNodeWithAgentData(node, agentResponse) {
  return {
    ...node,
    elevenlabs_config: appendAgentResponseToConfig(node, agentResponse),
  };
}

/**
 * Updates all nodes with their agent creation responses
 * @param {Array} promptFlowData - Array of nodes from promptFlow
 * @param {Array} agentResponses - Array of agent creation responses with node references
 * @returns {Object} - Object containing results and updated data
 */
function updateAllNodesWithAgentData(promptFlowData, agentResponses) {
  let updatedCount = 0;
  const updatedNodes = [];

  // Create a map of agent responses by node ID for quick lookup
  const responseMap = new Map();
  agentResponses.forEach((response) => {
    if (response.nodeId && response.agentData) {
      responseMap.set(response.nodeId, response.agentData);
    }
  });

  const updatedData = promptFlowData.map((item) => {
    const agentResponse = responseMap.get(item.id);
    if (agentResponse) {
      const updatedItem = updateNodeWithAgentData(item, agentResponse);
      updatedCount++;
      updatedNodes.push({
        id: item.id,
        name: item.name,
        agentId: agentResponse.agent_id,
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
  hasValidElevenLabsConfig,
  hasAgentCreationData,
  isGroupNode,
  analyzeNodesForAgentCreation,
  appendAgentResponseToConfig,
  updateNodeWithAgentData,
  updateAllNodesWithAgentData,
};
