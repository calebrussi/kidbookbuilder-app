/**
 * Workflow creation library for converting promptFlow.json to workflow.json
 */

/**
 * Checks if a node has an elevenlabs_config with an agent_id
 * @param {Object} node - The node to check
 * @returns {boolean} - True if elevenlabs_config exists and has agent_id
 */
function hasElevenLabsAgent(node) {
  return (
    node.elevenlabs_config &&
    typeof node.elevenlabs_config === "object" &&
    node.elevenlabs_config.agent_id
  );
}

/**
 * Converts a camelCase or snake_case string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
function toTitleCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase
    .replace(/_/g, " ") // snake_case
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words
}

/**
 * Converts a string to kebab-case for IDs
 * @param {string} str - String to convert
 * @returns {string} - Kebab case string
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase
    .replace(/_/g, "-") // snake_case
    .replace(/\s+/g, "-") // spaces
    .toLowerCase();
}

/**
 * Sorts nodes by their dependencies (simple topological sort)
 * @param {Array} nodes - Array of nodes to sort
 * @returns {Array} - Sorted array of nodes
 */
function sortNodesByDependencies(nodes) {
  const sorted = [];
  const visited = new Set();
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  function visit(nodeId) {
    if (visited.has(nodeId)) return;

    const node = nodeMap.get(nodeId);
    if (!node) return;

    // Visit dependencies first
    if (node.dependencies && Array.isArray(node.dependencies)) {
      node.dependencies.forEach((depId) => visit(depId));
    }

    visited.add(nodeId);
    sorted.push(node);
  }

  // Visit all nodes
  nodes.forEach((node) => visit(node.id));

  return sorted;
}

/**
 * Groups nodes by their group_id and maintains dependency order
 * @param {Array} nodes - Array of nodes from promptFlow
 * @returns {Array} - Array of grouped sections with ordered steps
 */
function groupNodesIntoSections(nodes) {
  // Filter out group definitions (they start with "group_")
  const stepNodes = nodes.filter((node) => !node.id.startsWith("group_"));

  // Group nodes by group_id
  const groupedNodes = {};
  stepNodes.forEach((node) => {
    const groupId = node.group_id || "default";
    if (!groupedNodes[groupId]) {
      groupedNodes[groupId] = [];
    }
    groupedNodes[groupId].push(node);
  });

  // Convert groups to sections with proper ordering
  const sections = [];
  let sectionOrder = 0;
  let globalStepOrder = 0;

  Object.keys(groupedNodes).forEach((groupId) => {
    const groupNodes = groupedNodes[groupId];

    // Sort nodes within group by dependencies
    const sortedNodes = sortNodesByDependencies(groupNodes);

    // Create section
    const section = {
      id: toKebabCase(groupId),
      title: toTitleCase(groupId.replace(/^group_/, "")),
      order: sectionOrder++,
      steps: sortedNodes.map((node) => ({
        id: toKebabCase(node.name),
        title: node.description || toTitleCase(node.name),
        order: globalStepOrder++,
        sectionId: toKebabCase(groupId),
        agentId: node.elevenlabs_config?.agent_id,
      })),
    };

    sections.push(section);
  });

  return sections;
}

/**
 * Validates that all step nodes have agent_id defined
 * @param {Array} nodes - Array of nodes from promptFlow
 * @throws {Error} - If any step node is missing agent_id
 */
function validateAgentIds(nodes) {
  const stepNodes = nodes.filter((node) => !node.id.startsWith("group_"));
  const nodesWithoutAgentId = stepNodes.filter(
    (node) => !hasElevenLabsAgent(node)
  );

  if (nodesWithoutAgentId.length > 0) {
    const missingAgentNodes = nodesWithoutAgentId
      .map((node) => `  - ${node.name} (${node.id})`)
      .join("\n");

    throw new Error(
      `❌ The following nodes are missing agent_id in their elevenlabs_config:\n${missingAgentNodes}\n\n` +
        `Please run the agent creation process first using:\n` +
        `  npm run agentCreate\n` +
        `  node agentCreate.js`
    );
  }
}

/**
 * Creates a workflow.json from a promptFlow.json file
 * @param {Array} promptFlowData - The parsed promptFlow data
 * @param {Object} options - Additional options
 * @returns {Object} - The created workflow object
 */
function createWorkflowFromPromptFlow(promptFlowData, options = {}) {
  // Validate that all step nodes have agent_id
  validateAgentIds(promptFlowData);

  // Create workflow structure
  const workflow = {
    id: options.workflowId || "character-creation-quiz",
    title: options.workflowTitle || "Character Creation Quiz",
    description:
      options.workflowDescription ||
      "Create your perfect story character through this interactive quiz",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: groupNodesIntoSections(promptFlowData),
  };

  return workflow;
}

module.exports = {
  hasElevenLabsAgent,
  toTitleCase,
  toKebabCase,
  sortNodesByDependencies,
  groupNodesIntoSections,
  validateAgentIds,
  createWorkflowFromPromptFlow,
};
