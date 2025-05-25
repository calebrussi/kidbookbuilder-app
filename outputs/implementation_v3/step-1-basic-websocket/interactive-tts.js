import "dotenv/config";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import readline from "readline";

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load API key from .env file
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("Error: ELEVENLABS_API_KEY is not set in the .env file");
  process.exit(1);
}

// Voice ID for the ElevenLabs voice to use
const voice_id = "Xb7hH8MSUJpSbSDYk0k2"; // Example voice ID
const model_id = "eleven_flash_v2_5";

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to connect to the WebSocket and stream text to speech
async function textToSpeechWithUserInput() {
  return new Promise((resolve) => {
    rl.question(
      'Enter the text you want to convert to speech (or type "exit" to quit): ',
      (userText) => {
        if (userText.toLowerCase() === "exit") {
          rl.close();
          resolve();
          return;
        }

        // Create a unique filename based on timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const outputFile = path.join(outputDir, `speech-${timestamp}.mp3`);

        // Connect to WebSocket and process the text
        const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream-input?model_id=${model_id}`;
        console.log("Connecting to WebSocket...");

        const ws = new WebSocket(uri);
        const fileStream = fs.createWriteStream(outputFile);

        ws.on("open", () => {
          console.log("WebSocket connection established");

          // Initialize the connection with voice settings
          const initialMessage = {
            text: " ",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              use_speaker_boost: false,
            },
            generation_config: {
              chunk_length_schedule: [120, 160, 250, 290],
            },
            xi_api_key: ELEVENLABS_API_KEY,
          };

          ws.send(JSON.stringify(initialMessage));

          // Send the user's text
          console.log("Sending text for processing...");
          ws.send(JSON.stringify({ text: userText }));

          // Send empty string to close the connection after processing
          setTimeout(() => {
            ws.send(JSON.stringify({ text: "", flush: true }));
          }, 1000);
        });

        ws.on("message", (message) => {
          try {
            const data = JSON.parse(message);

            if (data.audio) {
              // Decode the base64 audio and write it to the file
              const audioBuffer = Buffer.from(data.audio, "base64");
              fileStream.write(audioBuffer, (err) => {
                if (err) {
                  console.error("Error writing audio data to file:", err);
                } else {
                  console.log(
                    `Audio generation complete. Saved to: ${outputFile}`
                  );
                  fileStream.end();

                  // Continue with another prompt
                  textToSpeechWithUserInput().then(resolve);
                }
              });
            } else {
              console.log(
                "Received WebSocket message:",
                JSON.stringify(data).substring(0, 100) +
                  (JSON.stringify(data).length > 100 ? "..." : "")
              );
            }
          } catch (error) {
            console.error("Error processing message:", error);
          }
        });

        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
          textToSpeechWithUserInput().then(resolve);
        });

        ws.on("close", () => {
          console.log("WebSocket connection closed");
          fileStream.end();
        });
      }
    );
  });
}

// Run the interactive text to speech function
console.log("Starting ElevenLabs Interactive Text-to-Speech example...");
console.log(
  "This example will convert your text input to speech using ElevenLabs API."
);
textToSpeechWithUserInput().then(() => {
  console.log("Exiting application");
});
