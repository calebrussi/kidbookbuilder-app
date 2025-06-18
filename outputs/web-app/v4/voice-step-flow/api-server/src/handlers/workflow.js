import fs from "fs";
import path from "path";
// Use default import instead of named import for CommonJS compatibility
import url from "url";
const { fileURLToPath } = url;

// TODO: Hacky workaround because Netlify doesn't support import.meta.url
const workflowJson = {
  id: "character-creation-quiz",
  title: "Character Creation Quiz",
  description:
    "Create your perfect story character through this interactive quiz",
  createdAt: "2025-06-18T00:25:43.612Z",
  updatedAt: "2025-06-18T00:25:43.613Z",
  sections: [
    {
      id: "group-1",
      title: "Personal Intro",
      order: 0,
      steps: [
        {
          id: "what-is-your-name",
          title: "What is your name?",
          order: 0,
          sectionId: "group-1",
          agentId: "agent_01jy06tg14fxxv0ymvha6ybjrj",
        },
        {
          id: "what-kind-of-hobbies",
          title: "What kind of hobbies do you enjoy?",
          order: 1,
          sectionId: "group-1",
          agentId: "agent_01jy06tjdjfnmrnwrxfw1mwxa8",
        },
      ],
    },
    {
      id: "group-2",
      title: "Tell Me Your Story Style",
      order: 1,
      steps: [
        {
          id: "what-types-of-stories",
          title: "What types of stories do you love?",
          order: 2,
          sectionId: "group-2",
          agentId: "agent_01jy06tmrtfb0ae1wd9e551njw",
        },
      ],
    },
  ],
};
// Get workflow endpoint with authentication - using relative path from project root
const getWorkflowHandler = (req, res) => {
  const { name, passcode } = req.body;

  console.log(`📋 POST /api/workflow - Request from: ${name || "unknown"}`);
  console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));

  // Check if QUIZ_PASSCODE is set before deciding validation requirements
  const validPasscode = process.env.QUIZ_PASSCODE;
  console.log(
    `🔑 QUIZ_PASSCODE env var:`,
    validPasscode ? "[SET TO: " + validPasscode + "]" : "[NOT SET]"
  );
  console.log(`🔒 User provided passcode: "${passcode}"`);
  console.log(`🔍 Comparing: "${passcode}" === "${validPasscode}"`);
  console.log(`🔍 Type check: typeof validPasscode = ${typeof validPasscode}`);

  // Validate input - only require passcode if QUIZ_PASSCODE is set
  if (!name || (validPasscode && validPasscode.trim() !== "" && !passcode)) {
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message:
        validPasscode && validPasscode.trim() !== ""
          ? "Name and passcode are required"
          : "Name is required",
    });
  }

  // Only check the passcode if QUIZ_PASSCODE is actually set and not empty
  if (
    validPasscode &&
    validPasscode.trim() !== "" &&
    passcode !== validPasscode
  ) {
    console.log(`❌ Authentication failed for ${name} - Invalid passcode`);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid passcode",
    });
  }

  // If QUIZ_PASSCODE is not set or empty, log that we're bypassing authentication
  if (!validPasscode || validPasscode.trim() === "") {
    console.log(
      `ℹ️ Authentication bypassed for ${name} - No passcode required`
    );
  }

  // console.log(`✅ Authentication successful for: ${name}`);
  // console.log(`📋 Loading workflow for: ${name}`);

  // // Debug: List directory contents to see what's available
  // console.log(`📂 Current working directory: ${process.cwd()}`);
  // console.log(`🌍 Environment: ${process.env.NETLIFY ? "Netlify" : "Local"}`);

  // console.log("workflowJson:", workflowJson);

  // try {
  //   const cwdContents = fs.readdirSync(process.cwd());
  //   console.log(`📁 Contents of ${process.cwd()}:`, cwdContents);

  //   // Check if api-server directory exists
  //   if (cwdContents.includes("api-server")) {
  //     const apiServerContents = fs.readdirSync(
  //       path.join(process.cwd(), "api-server")
  //     );
  //     console.log(`📁 Contents of api-server/:`, apiServerContents);

  //     if (apiServerContents.includes("src")) {
  //       const srcContents = fs.readdirSync(
  //         path.join(process.cwd(), "api-server", "src")
  //       );
  //       console.log(`📁 Contents of api-server/src/:`, srcContents);

  //       if (srcContents.includes("data")) {
  //         const dataContents = fs.readdirSync(
  //           path.join(process.cwd(), "api-server", "src", "data")
  //         );
  //         console.log(`📁 Contents of api-server/src/data/:`, dataContents);
  //       }
  //     }
  //   }
  // } catch (listErr) {
  //   console.error(`❌ Error listing directories:`, listErr);
  // }

  // // Get the current file's directory using import.meta.url
  // console.log("import.meta.url:", import.meta.url);

  // const __filename = fileURLToPath(import.meta.url);
  // console.log(`📂 Current __filename: ${__filename}`);
  // const __dirname = path.dirname(__filename);
  // console.log(`📂 Current __dirname: ${__dirname}`);

  // // Use different paths for local vs Netlify environments
  // // Using import.meta.url to get reliable path relative to this module
  // let workflowPath = path.resolve(__dirname, "../data/workflow.json");

  // if (!fs.existsSync(workflowPath)) {
  //   console.warn(
  //     `⚠️ workflow.json not found at ${workflowPath}, trying alternative paths`
  //   );
  //   // Try process.cwd() as fallback
  //   workflowPath = path.resolve(
  //     process.cwd(),
  //     "api-server/src/data/workflow.json"
  //   );

  //   if (!fs.existsSync(workflowPath)) {
  //     workflowPath = path.resolve(process.cwd(), "workflow.json");
  //   }
  // }

  // Add an 3-second delay
  setTimeout(() => {
    // fs.readFile(workflowPath, "utf8", (err, data) => {
    //   if (err) {
    //     console.error("❌ Failed to read workflow.json:", err);
    //     return res.status(500).json({
    //       success: false,
    //       error: "Internal server error",
    //       message: "Unable to load workflow.json file",
    //     });
    //   }
    //   try {
    // const workflow = JSON.parse(data);
    console.log(`✅ Workflow loaded successfully for: ${name}`);
    res.json(workflowJson);
    //   } catch (parseErr) {
    //     console.error("❌ Failed to parse workflow.json:", parseErr);
    //     res.status(500).json({
    //       success: false,
    //       error: "Internal server error",
    //       message: "workflow.json is not valid JSON",
    //     });
    //   }
    // });
  }, 1000); // 3000 milliseconds = 3 seconds
};

const getWorkflowSimpleHandler = (req, res) => {
  // Add an 3-second delay
  setTimeout(() => {
    console.log(`✅ Testing workflow loaded successfully`);
    res.json(workflowJson);
  }, 1000); // 3000 milliseconds = 3 seconds
};

export { getWorkflowHandler, getWorkflowSimpleHandler };
