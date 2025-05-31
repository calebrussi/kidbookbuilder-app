console.log("🧪 Testing authentication flow...");

// Test the authentication flow in the browser console
const testAuth = async () => {
  console.log("1. Checking initial state (should show auth form)...");

  // Simulate successful authentication
  console.log("2. Simulating authentication...");

  // Test API call
  console.log("3. Testing API call...");
  try {
    const response = await fetch("http://localhost:3001/api/workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test User",
        passcode: "demo123",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API call successful:", data.title);
    } else {
      console.log("❌ API call failed:", response.status);
    }
  } catch (error) {
    console.log("❌ API call error:", error);
  }
};

// Run the test
testAuth();
