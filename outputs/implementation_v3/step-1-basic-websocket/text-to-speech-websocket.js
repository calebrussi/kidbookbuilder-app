import "dotenv/config";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

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
// You can get voice IDs from https://api.elevenlabs.io/v1/voices
const voice_id = "Xb7hH8MSUJpSbSDYk0k2"; // Example voice ID

// For use cases where latency is important, use the 'eleven_flash_v2_5' model
const model_id = "eleven_flash_v2_5";

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to connect to the WebSocket and stream text to speech
async function textToSpeechWSStreaming() {
  // Construct the WebSocket URI
  const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream-input?model_id=${model_id}`;

  console.log("Connecting to WebSocket...");

  // Create a WebSocket connection
  const ws = new WebSocket(uri);

  // Create a writable stream to save the audio
  const fileStream = fs.createWriteStream(path.join(outputDir, "test.mp3"));

  // Handle WebSocket events
  ws.on("open", () => {
    console.log("WebSocket connection established");

    // Initialize the connection with voice settings
    const initialMessage = {
      text: " ", // Initial space to establish connection
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

    // Send the text to convert to speech
    const text =
      "The twilight sun cast its warm golden hues upon the vast rolling fields, saturating the landscape with an ethereal glow. Silently, the meandering brook continued its ceaseless journey, whispering secrets only the trees seemed privy to.";
    ws.send(JSON.stringify({ text: text }));

    // Send empty string to indicate the end of the text sequence
    // This will close the WebSocket connection
    setTimeout(() => {
      ws.send(JSON.stringify({ text: "" }));
    }, 1000);
  });

  ws.on("message", (message) => {
    try {
      console.log("Received message from WebSocket");
      const data = JSON.parse(message);

      if (data.audio) {
        // Decode the base64 audio and write it to the file
        const audioBuffer = Buffer.from(data.audio, "base64");
        fileStream.write(audioBuffer, (err) => {
          if (err) {
            console.error("Error writing audio data to file:", err);
          } else {
            console.log("Audio chunk written successfully");
          }
        });
      } else {
        console.log(
          "Received non-audio message:",
          JSON.stringify(data).substring(0, 100) +
            (JSON.stringify(data).length > 100 ? "..." : "")
        );
      }

      if (data.isFinal) {
        console.log("Audio generation complete");
        fileStream.end();
      }
    } catch (error) {
      console.error("Error processing message:", error);
      console.error("Raw message content:", message);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    fileStream.end();
  });
}

// Run the text to speech function
console.log("Starting ElevenLabs WebSocket Text-to-Speech example...");
textToSpeechWSStreaming();
