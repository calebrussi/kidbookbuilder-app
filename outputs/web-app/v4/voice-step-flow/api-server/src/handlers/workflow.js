import fs from "fs";
import path from "path";
// Use default import instead of named import for CommonJS compatibility
import url from "url";
const { fileURLToPath } = url;

const workflowJson = {
  id: "character-creation-quiz",
  title: "Character Creation Quiz",
  description:
    "Create your perfect story character through this interactive quiz",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  sections: [
    {
      id: "introduction",
      title: "Introduce Yourself",
      order: 0,
      steps: [
        {
          id: "name",
          title: "What's your name?",
          order: 0,
          sectionId: "introduction",
          agentId: "agent_01jwefmysxe4bb9xmgdvxrjxzz",
        },
      ],
    },
    {
      id: "story-style",
      title: "Tell Me Your Story Style",
      order: 1,
      steps: [
        {
          id: "favorite-stories",
          title: "What stories do you love?",
          order: 1,
          sectionId: "story-style",
          agentId: "agent_01jwefn1xpfj8rkz2qga8ak021",
        },
        {
          id: "story-length",
          title: "How long should your story be?",
          order: 2,
          sectionId: "story-style",
          agentId: "agent_01jwejc6azejc9xnq5n9a22qp3",
        },
      ],
    },
    {
      id: "story-world",
      title: "Design Your Story World",
      order: 2,
      steps: [
        {
          id: "world-type",
          title: "Magic or Real World?",
          order: 3,
          sectionId: "story-world",
          agentId: "agent_01jwejc9a2fgy980awe2c4xkkf",
        },
        {
          id: "setting",
          title: "Pick Your Setting",
          order: 4,
          sectionId: "story-world",
          agentId: "agent_01jwejcbnjehk87612zrhhmxw6",
        },
        {
          id: "time-period",
          title: "When Does It Happen?",
          order: 5,
          sectionId: "story-world",
          agentId: "agent_01jwejcdsxenc8s8yr9j336rbp",
        },
        {
          id: "environment",
          title: "Weather & Places",
          order: 6,
          sectionId: "story-world",
          agentId: "agent_01jwejcfxqfd4ayw49rfrk4rd8",
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
