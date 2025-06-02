#!/usr/bin/env node

import fetch from "node-fetch";

// Configuration
const SERVER_URL = "http://localhost:3001";
const ENDPOINT = "/api/workflow/agent";

// Test data - using agent IDs from workflow.json
const TEST_AGENTS = [
  "agent_01jwefmysxe4bb9xmgdvxrjxzz", // name
  "agent_01jwefn1xpfj8rkz2qga8ak021", // favorite-stories
  "agent_01jwejc6azejc9xnq5n9a22qp3", // story-length
  "agent_01jwejc9a2fgy980awe2c4xkkf", // world-type
  "agent_01jwejcbnjehk87612zrhhmxw6", // setting
  "agent_01jwejcdsxenc8s8yr9j336rbp", // time-period
  "agent_01jwejcfxqfd4ayw49rfrk4rd8", // environment
];

async function testSignedUrl(agentId) {
  console.log(`\n🧪 Testing signed URL for agent: ${agentId}`);
  console.log("=".repeat(50));

  try {
    const response = await fetch(`${SERVER_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: agentId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Success!");
      console.log(`   Agent ID: ${data.data.agentId}`);
      console.log(`   Signed URL: ${data.data.signedUrl}`);
      console.log(`   Expires In: ${data.data.expiresIn}`);
      console.log(`   Message: ${data.message}`);
    } else {
      console.log("❌ Error!");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Message: ${data.message}`);
    }
  } catch (error) {
    console.log("💥 Network/Connection Error!");
    console.log(`   Error: ${error.message}`);
  }
}

async function testInvalidAgent() {
  console.log(`\n🧪 Testing with invalid agent ID`);
  console.log("=".repeat(50));

  try {
    const response = await fetch(`${SERVER_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: "invalid-agent-id",
      }),
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log("💥 Network/Connection Error!");
    console.log(`   Error: ${error.message}`);
  }
}

async function testMissingAgentId() {
  console.log(`\n🧪 Testing with missing agentId`);
  console.log("=".repeat(50));

  try {
    const response = await fetch(`${SERVER_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log("💥 Network/Connection Error!");
    console.log(`   Error: ${error.message}`);
  }
}

async function main() {
  console.log("🚀 Starting Signed URL Endpoint Tests");
  console.log(`📡 Server: ${SERVER_URL}`);
  console.log(`🎯 Endpoint: ${ENDPOINT}`);

  // Test server availability first
  try {
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    if (!healthResponse.ok) {
      console.log(
        "❌ Server health check failed. Make sure the server is running."
      );
      process.exit(1);
    }
    console.log("✅ Server is running and healthy");
  } catch (error) {
    console.log(
      "❌ Cannot connect to server. Make sure it's running on port 3001."
    );
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  // Test valid agent IDs
  for (const agentId of TEST_AGENTS) {
    await testSignedUrl(agentId);
  }

  // Test error cases
  await testInvalidAgent();
  await testMissingAgentId();

  console.log("\n🏁 All tests completed!");
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSignedUrl, testInvalidAgent, testMissingAgentId };
