# ElevenLabs WebSocket Text-to-Speech Example

This is a basic implementation of the ElevenLabs Text-to-Speech API using WebSockets in Node.js.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure your API key:
   - Open the `.env` file
   - Replace `your_elevenlabs_api_key_here` with your actual ElevenLabs API key

3. (Optional) Customize the voice and model:
   - Open `text-to-speech-websocket.js`
   - Change the `voice_id` to your preferred voice from ElevenLabs
   - You can find available voices in your ElevenLabs account or via their API

## Running the Examples

### Basic Example
Run the basic script:
```
npm start
```

This will:
1. Connect to the ElevenLabs WebSocket API
2. Convert the example text to speech
3. Save the resulting audio as `output/test.mp3`

### Interactive Example
Run the interactive script:
```
npm run interactive
```

This will:
1. Prompt you to enter text that you want to convert to speech
2. Convert your text to speech using the ElevenLabs API
3. Save the audio files in the `output` directory with timestamped filenames
4. Allow you to enter more text or exit the application

## Customization

You can modify the following settings in the script:
- `voice_id`: Change to a different voice
- `model_id`: Change the text-to-speech model (default is `eleven_flash_v2_5` for low latency)
- The text message in the `text` variable
- Voice settings such as stability and similarity_boost
- Buffering settings in `chunk_length_schedule`

## Advanced Usage

For real-time applications, you might want to:
- Use `flush: true` to force immediate generation of buffered text
- Implement custom error handling
- Stream the audio directly to an audio player instead of saving to file

For more details, refer to the [ElevenLabs WebSocket API documentation](https://elevenlabs.io/docs/websockets).
