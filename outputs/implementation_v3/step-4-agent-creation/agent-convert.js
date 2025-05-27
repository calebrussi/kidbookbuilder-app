/**
 * convertConfigToAgent.js
 *
 * This script converts a configuration file like personality_config.json
 * to the format required by the agent creation API, using sample_agent_create.json as a template.
 *
 * Usage:
 *   Command line: node convertConfigToAgent.js <inputConfigPath> <outputPath> [templatePath]
 *   Programmatic with file path: convertConfig({ input: 'path/to/config.json', outputPath: 'output.json' })
 *   Programmatic with object: convertConfig({ input: configObject, outputPath: 'output.json' })
 *   Programmatic without file output: convertConfig({ input: configObject }) // returns config only
 */

const fs = require("fs");
const path = require("path");
const _ = require("lodash");

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

  // Use lodash's merge to deep merge the input config into the template
  // This will recursively merge objects and overwrite properties with values from inputConfig
  const mergedConfig = _.merge({}, outputConfig, inputConfig);

  // // Special handling for arrays - arrays should be completely replaced, not merged
  // // This is needed because lodash merge will combine arrays by default
  // const replaceArrays = (target, source, path = "") => {
  //   if (!source || typeof source !== "object") return;

  //   Object.keys(source).forEach((key) => {
  //     const currentPath = path ? `${path}.${key}` : key;
  //     const sourceValue = source[key];

  //     if (Array.isArray(sourceValue)) {
  //       // For arrays, replace the entire array from source
  //       _.set(target, currentPath, _.cloneDeep(sourceValue));

  //       // Special handling for criteria array to ensure required fields
  //       if (currentPath === "platform_settings.evaluation.criteria") {
  //         const criteria = _.get(target, currentPath);
  //         if (criteria) {
  //           criteria.forEach((criterion) => {
  //             if (criterion.use_knowledge_base === undefined) {
  //               criterion.use_knowledge_base = false;
  //             }
  //           });
  //         }
  //       }
  //     } else if (sourceValue && typeof sourceValue === "object") {
  //       replaceArrays(target, sourceValue, currentPath);
  //     }
  //   });
  // };

  // // Process the config to replace arrays
  // replaceArrays(mergedConfig, inputConfig);

  // // Special handling for data_collection to add required fields
  // if (
  //   mergedConfig.platform_settings &&
  //   mergedConfig.platform_settings.data_collection
  // ) {
  //   for (const key in mergedConfig.platform_settings.data_collection) {
  //     const field = mergedConfig.platform_settings.data_collection[key];

  //     // Ensure all data_collection fields have these properties
  //     if (field.dynamic_variable === undefined) {
  //       field.dynamic_variable = "";
  //     }
  //     if (field.constant_value === undefined) {
  //       field.constant_value = "";
  //     }
  //   }
  // }

  return mergedConfig;
}

/**
 * Converts configuration to agent format with flexible input options
 * @param {Object} options - Configuration options
 * @param {string|Object} options.input - Either a file path (string) or input config object
 * @param {string} [options.outputPath] - Output file path (optional)
 * @param {string} [options.templatePath] - Template file path
 * @returns {Promise<Object>} - Result object with success status and output config
 */
async function convertConfig(options = {}) {
  try {
    // Handle different calling patterns for backward compatibility
    let input, outputPath, templatePath;

    if (typeof options === "string" || !options.input) {
      // Legacy mode: called without options object or from command line
      input = options.input || process.argv[2] || DEFAULT_INPUT_PATH;
      outputPath = options.outputPath || process.argv[3] || DEFAULT_OUTPUT_PATH;
      templatePath =
        options.templatePath || process.argv[4] || DEFAULT_TEMPLATE_PATH;
    } else {
      // New mode: called with options object
      input = options.input;
      outputPath = options.outputPath;
      templatePath = options.templatePath || DEFAULT_TEMPLATE_PATH;
    }

    let inputConfig;
    let configName;

    // Handle input - either file path or object
    if (typeof input === "string") {
      console.log(`Reading input configuration from: ${input}`);
      inputConfig = JSON.parse(fs.readFileSync(input, "utf8"));
      configName =
        inputConfig.name || path.basename(input, path.extname(input));
    } else if (typeof input === "object" && input !== null) {
      console.log(`Using provided input configuration object`);
      inputConfig = input;
      configName = inputConfig.name || "unnamed-config";
    } else {
      throw new Error(
        "Input must be either a file path string or a configuration object"
      );
    }

    console.log(`Using template from: ${templatePath}`);

    // Read and parse the template configuration file
    const templateConfig = JSON.parse(fs.readFileSync(templatePath, "utf8"));

    // Transform the configuration using the template
    const outputConfig = transformConfig(inputConfig, templateConfig);

    // If no output path is specified, return the config without saving to file
    if (!outputPath) {
      console.log(
        "No output path specified - returning transformed configuration"
      );
      return { success: true, outputConfig };
    }

    // Modify the output path to include the config name if using default path
    let finalOutputPath = outputPath;
    if (outputPath === DEFAULT_OUTPUT_PATH) {
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

    return { success: true, outputPath: finalOutputPath, outputConfig };
  } catch (error) {
    console.error("Error converting configuration:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Legacy function to maintain backward compatibility
 * Main function to convert the config using file paths
 */
async function convertConfigFromPath(inputPath, outputPath, templatePath) {
  return convertConfig({
    input: inputPath || DEFAULT_INPUT_PATH,
    outputPath: outputPath || DEFAULT_OUTPUT_PATH,
    templatePath: templatePath || DEFAULT_TEMPLATE_PATH,
  });
}

// Run the script if it's called directly
if (require.main === module) {
  convertConfig();
}

// Export functions for use in other modules
module.exports = {
  convertConfig,
  convertConfigFromPath,
  transformConfig,
};
