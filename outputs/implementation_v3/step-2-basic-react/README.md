# Character Creation Quiz - ElevenLabs Integration

This Next.js application integrates with ElevenLabs' conversational AI to create an interactive character creation experience for storytellers.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory with your ElevenLabs agent ID:

   ```
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Real-time voice conversations with an AI agent
- Interactive character creation through natural dialogue
- Text transcript of the conversation
- Controls to start and stop the conversation

## Implementation Details

This application uses:

- Next.js 14 for the React framework
- ElevenLabs' @11labs/react library for conversation handling
- TailwindCSS for styling
- WebSocket connection for real-time audio streaming

## Requirements

- Microphone access for voice input
- Modern web browser with WebSocket support
- ElevenLabs agent configured for character creation

## Next Steps

- Add visual feedback for voice activity
- Implement error handling and retry logic
- Save character creation results to a file or database
- Add more customization options for character traits
