import fs from "fs";
import path from "path";

// Get workflow endpoint with authentication - using relative path from project root
const getWorkflowHandler = (req, res) => {
  const { name, passcode } = req.body;

  console.log(`📋 POST /api/workflow - Request from: ${name || "unknown"}`);
  console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));

  // Validate input
  if (!name || !passcode) {
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message: "Name and passcode are required",
    });
  }

  // Check passcode (you can modify this logic as needed)
  const validPasscode = process.env.QUIZ_PASSCODE || "demo123";

  if (passcode !== validPasscode) {
    console.log(`❌ Authentication failed for ${name} - Invalid passcode`);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid passcode",
    });
  }

  console.log(`✅ Authentication successful for: ${name}`);
  console.log(`📋 Loading workflow for: ${name}`);

  // Use relative path that works in both local and Netlify environments
  const workflowPath = path.resolve(
    process.cwd(),
    "../voice-step-flow/api-server/src/data/workflow.json"
  );

  // Add an 3-second delay
  setTimeout(() => {
    fs.readFile(workflowPath, "utf8", (err, data) => {
      if (err) {
        console.error("❌ Failed to read workflow.json:", err);
        return res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "Unable to load workflow.json file",
        });
      }
      try {
        const workflow = JSON.parse(data);
        console.log(`✅ Workflow loaded successfully for: ${name}`);
        res.json(workflow);
      } catch (parseErr) {
        console.error("❌ Failed to parse workflow.json:", parseErr);
        res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "workflow.json is not valid JSON",
        });
      }
    });
  }, 1000); // 3000 milliseconds = 3 seconds
};

export { getWorkflowHandler };
