// Simple OpenRouter integration using OpenAI SDK
require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// Initialize OpenAI client with OpenRouter base URL
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Create outputs directory if it doesn't exist
const outputDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function main() {
  try {
    console.log("Sending request to OpenRouter...");

    // Define messages array first so we can reference it later
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant for children creating stories.",
      },
      {
        role: "user",
        content:
          "What are some good story settings for a 10-year-old who likes adventure and magic?",
      },
    ];

    const completion = await client.chat.completions.create({
      extra_headers: {
        "HTTP-Referer": "https://kidbookbuilder.app", // Optional: Site URL
        "X-Title": "Kid Book Builder", // Optional: Site title
      },
      model: "openai/gpt-4o-mini",
      messages: messages,
    });

    console.log("Response from OpenRouter:");
    console.log(completion.choices[0].message.content);

    // Save response to a JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = path.join(
      outputDir,
      `openrouter-simple-response-${timestamp}.json`
    );

    // Get the user prompt from the messages array
    const userPrompt = messages.find((msg) => msg.role === "user").content;

    const responseData = {
      timestamp: new Date().toISOString(),
      model: completion.model,
      prompt: userPrompt,
      messages: messages,
      response: completion.choices[0].message.content,
      fullResponse: completion,
    };

    fs.writeFileSync(outputFile, JSON.stringify(responseData, null, 2));
    console.log(`Response saved to: ${outputFile}`);
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
  }
}

main();
