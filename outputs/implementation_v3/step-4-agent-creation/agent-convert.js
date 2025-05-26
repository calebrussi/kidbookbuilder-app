/**
 * convertConfigToAgent.js
 *
 * This script converts a configuration file like personality_config.json
 * to the format required by the agent creation API, using sample_agent_create.json as a template.
 *
 * Usage: node convertConfigToAgent.js <inputConfigPath> <outputPath> [templatePath]
 *        If no paths are provided, it will use default paths.
 */

const fs = require("fs");
const path = require("path");

// Default paths
const DEFAULT_INPUT_PATH = path.join(
  __dirname,
  "outputs",
  "agent-config-result-story_genre_selection_agent.json"
);
const DEFAULT_OUTPUT_PATH = path.join(
  __dirname,
  "outputs",
  "agent-convert-result.json"
);
const DEFAULT_TEMPLATE_PATH = path.join(
  __dirname,
  "inputs",
  "agent_template_default.json"
);

/**
 * Transforms the config to the expected agent API format using a template
 * @param {Object} inputConfig - The input configuration object
 * @param {Object} templateConfig - The template configuration object
 * @returns {Object} - The transformed configuration object
 */
function transformConfig(inputConfig, templateConfig) {
  // Create a deep copy of the template to use as our base structure
  const outputConfig = JSON.parse(JSON.stringify(templateConfig));

  // Function to recursively merge input into template
  const mergeObjects = (target, source, path = "") => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return;
    }

    // Process all keys from the input config
    for (const key of Object.keys(source)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        // For nested objects, create the structure if it doesn't exist in target
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        // Recursively merge the nested object
        mergeObjects(target[key], source[key], currentPath);
      } else if (Array.isArray(source[key])) {
        // Handle arrays - replace the entire array from source
        target[key] = JSON.parse(JSON.stringify(source[key]));

        // Special handling for criteria array to ensure required fields
        if (currentPath === "platform_settings.evaluation.criteria") {
          target[key].forEach((criterion) => {
            if (criterion.use_knowledge_base === undefined) {
              criterion.use_knowledge_base = false;
            }
          });
        }
      } else {
        // For primitive values, copy from source to target
        target[key] = source[key];
      }
    }
  };

  // Start with core properties
  if (inputConfig.name) {
    outputConfig.name = inputConfig.name;
  }

  // Handle conversation_config section
  if (inputConfig.conversation_config) {
    mergeObjects(
      outputConfig.conversation_config,
      inputConfig.conversation_config
    );
  }

  // Handle platform_settings section
  if (inputConfig.platform_settings) {
    mergeObjects(outputConfig.platform_settings, inputConfig.platform_settings);
  }

  // Special handling for data_collection to add required fields
  if (
    outputConfig.platform_settings &&
    outputConfig.platform_settings.data_collection
  ) {
    for (const key in outputConfig.platform_settings.data_collection) {
      const field = outputConfig.platform_settings.data_collection[key];

      // Ensure all data_collection fields have these properties
      if (field.dynamic_variable === undefined) {
        field.dynamic_variable = "";
      }
      if (field.constant_value === undefined) {
        field.constant_value = "";
      }
    }
  }

  return outputConfig;
}

/**
 * Main function to convert the config
 */
async function convertConfig() {
  try {
    // Determine input, output, and template paths from command line arguments
    const inputPath = process.argv[2] || DEFAULT_INPUT_PATH;
    const outputPath = process.argv[3] || DEFAULT_OUTPUT_PATH;
    const templatePath = process.argv[4] || DEFAULT_TEMPLATE_PATH;

    console.log(`Reading input configuration from: ${inputPath}`);
    console.log(`Using template from: ${templatePath}`);

    // Read and parse the input and template configuration files
    const inputConfig = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const templateConfig = JSON.parse(fs.readFileSync(templatePath, "utf8"));

    // Transform the configuration using the template
    const outputConfig = transformConfig(inputConfig, templateConfig);

    // Get the config name to append to the output filename
    const configName =
      inputConfig.name || path.basename(inputPath, path.extname(inputPath));

    // Modify the output path to include the config name
    let finalOutputPath = outputPath;
    if (outputPath === DEFAULT_OUTPUT_PATH) {
      // If using default path, modify it to include the config name
      const outputDir = path.dirname(outputPath);
      const outputExt = path.extname(outputPath);
      const outputBase = path.basename(outputPath, outputExt);
      finalOutputPath = path.join(
        outputDir,
        `${outputBase}-${configName}${outputExt}`
      );
    }

    // Ensure the output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    // Write the transformed configuration to the output file
    fs.writeFileSync(finalOutputPath, JSON.stringify(outputConfig, null, 2));
    console.log(`Transformed configuration saved to: ${finalOutputPath}`);

    return { success: true, outputPath: finalOutputPath };
  } catch (error) {
    console.error("Error converting configuration:", error);
    return { success: false, error: error.message };
  }
}

// Run the script if it's called directly
if (require.main === module) {
  convertConfig();
}

// Export functions for use in other modules
module.exports = {
  convertConfig,
  transformConfig,
};
