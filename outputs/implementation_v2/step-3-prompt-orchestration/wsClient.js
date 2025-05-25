const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class StoryPreferencesClient {
    constructor(apiKey, config) {
        this.apiKey = apiKey;
        this.config = config;
        this.ws = null;
        this.isConnected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const voiceId = "Xb7hH8MSUJpSbSDYk0k2"; // Child-friendly voice
            const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_monolingual_v1`;
            
            this.ws = new WebSocket(wsUrl, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            this.ws.on('open', () => {
                console.log('Connected to ElevenLabs WebSocket');
                this.isConnected = true;

                // Send the initial configuration
                const bos = {
                    text: this.config.firstMessage,
                    try_trigger_generation: true,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                };

                this.ws.send(JSON.stringify(bos));
                resolve();
            });

            // Create a file to store the audio
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const audioFile = path.join(__dirname, `output_${timestamp}.mp3`);
            const audioStream = fs.createWriteStream(audioFile);
            console.log(`Will save audio to: ${audioFile}`);

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.audio) {
                        // Convert base64 audio to binary and write to file
                        const audioData = Buffer.from(message.audio, 'base64');
                        audioStream.write(audioData);
                        console.log('Saved audio chunk');
                    } else {
                        console.log('Received message:', message);
                        if (message.isFinal) {
                            audioStream.end();
                            console.log(`Audio saved to: ${audioFile}`);
                        }
                    }
                } catch (error) {
                    // Handle binary audio data if any
                    console.log('Received binary audio data');
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('WebSocket connection closed');
                this.isConnected = false;
                // Ensure audio stream is closed
                if (audioStream) {
                    audioStream.end();
                }
            });
        });
    }

    async sendText(text) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        const message = {
            text: text,
            try_trigger_generation: true
        };

        this.ws.send(JSON.stringify(message));
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = { StoryPreferencesClient };
