import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

  // Debug: List directory contents to see what's available
  console.log(`📂 Current working directory: ${process.cwd()}`);
  console.log(`🌍 Environment: ${process.env.NETLIFY ? "Netlify" : "Local"}`);

  // Get the current file's directory using import.meta.url
  const __filename = fileURLToPath(import.meta.url);
  console.log(`📂 Current __filename: ${__filename}`);
  const __dirname = path.dirname(__filename);
  console.log(`📂 Current __dirname: ${__dirname}`);

  try {
    const cwdContents = fs.readdirSync(process.cwd());
    console.log(`📁 Contents of ${process.cwd()}:`, cwdContents);

    // Check if api-server directory exists
    if (cwdContents.includes("api-server")) {
      const apiServerContents = fs.readdirSync(
        path.join(process.cwd(), "api-server")
      );
      console.log(`📁 Contents of api-server/:`, apiServerContents);

      if (apiServerContents.includes("src")) {
        const srcContents = fs.readdirSync(
          path.join(process.cwd(), "api-server", "src")
        );
        console.log(`📁 Contents of api-server/src/:`, srcContents);

        if (srcContents.includes("data")) {
          const dataContents = fs.readdirSync(
            path.join(process.cwd(), "api-server", "src", "data")
          );
          console.log(`📁 Contents of api-server/src/data/:`, dataContents);
        }
      }
    }
  } catch (listErr) {
    console.error(`❌ Error listing directories:`, listErr);
  }

  // Use different paths for local vs Netlify environments
  // Using import.meta.url to get reliable path relative to this module
  let workflowPath = path.resolve(__dirname, "../data/workflow.json");

  if (!fs.existsSync(workflowPath)) {
    console.warn(
      `⚠️ workflow.json not found at ${workflowPath}, trying alternative paths`
    );
    // Try process.cwd() as fallback
    workflowPath = path.resolve(
      process.cwd(),
      "api-server/src/data/workflow.json"
    );

    if (!fs.existsSync(workflowPath)) {
      workflowPath = path.resolve(process.cwd(), "workflow.json");
    }
  }

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
