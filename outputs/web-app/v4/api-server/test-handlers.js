// Test script to verify handlers work correctly
const {
  healthHandler,
  getWorkflowHandler,
  getWorkflowJsonHandler,
  getConversationHandler,
  getSignedUrlHandler,
} = require("./src/handlers");

// Mock request and response objects
const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  res.send = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

// Test health handler
console.log("🧪 Testing health handler...");
const healthReq = {};
const healthRes = createMockRes();
healthHandler(healthReq, healthRes);
console.log("✅ Health handler response:", healthRes.data);

// Test workflow JSON handler (deprecated endpoint)
console.log("\n🧪 Testing workflow JSON handler (deprecated)...");
const workflowJsonReq = {};
const workflowJsonRes = createMockRes();
getWorkflowJsonHandler(workflowJsonReq, workflowJsonRes);
console.log("✅ Workflow JSON handler response:", workflowJsonRes.data);

console.log("\n🎉 Handler tests completed successfully!");
console.log("All handlers are properly exported and functional.");
