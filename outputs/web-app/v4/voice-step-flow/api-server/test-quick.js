#!/usr/bin/env node

import fetch from "node-fetch";

// Get agentId from command line argument or use default
const agentId = process.argv[2] || "agent_01jwefmysxe4bb9xmgdvxrjxzz"; // name step from workflow.json

async function testSingleStep(agentId) {
  console.log(`🧪 Testing signed URL for agent: "${agentId}"`);

  try {
    const response = await fetch("http://localhost:3001/api/workflow/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentId }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS");
      console.log(`Agent ID: ${data.data.agentId}`);
      console.log(`Signed URL: ${data.data.signedUrl}`);
      console.log(`Expires: ${data.data.expiresIn}`);
    } else {
      console.log(`❌ ERROR (${response.status})`);
      console.log(`Message: ${data.message}`);
    }
  } catch (error) {
    console.log("💥 NETWORK ERROR");
    console.log(`Error: ${error.message}`);
  }
}

// Run the test
testSingleStep(agentId);
