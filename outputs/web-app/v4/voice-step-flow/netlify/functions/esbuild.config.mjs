// esbuild configuration for Netlify Functions to use ESM format
export default {
  format: "esm",
  target: "node18",
  platform: "node",
  bundle: true,
  external: [
    "express",
    "serverless-http",
    "cors",
    "@elevenlabs/elevenlabs-js",
    "node-fetch",
    "dotenv",
  ],
  mainFields: ["module", "main"],
  conditions: ["import", "module", "default"],
};
