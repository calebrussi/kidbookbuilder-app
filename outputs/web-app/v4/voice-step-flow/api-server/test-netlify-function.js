#!/usr/bin/env node

// Test script for the Netlify function API
import fetch from "node-fetch";

const TEST_URL = "http://localhost:8888/.netlify/functions/api/workflow";
// For local testing, you can change this to your local API server:
// const TEST_URL = "http://localhost:3001/api/workflow";

const testData = {
  name: "Test User",
  passcode: "demo123",
};

async function testNetlifyFunction() {
  console.log("🧪 Testing Netlify function with JSON body...");
  console.log("📡 Sending request to:", TEST_URL);
  console.log("📝 Request body:", JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(TEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log("📊 Response status:", response.status);
    console.log(
      "📊 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log("✅ Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testNetlifyFunction();
