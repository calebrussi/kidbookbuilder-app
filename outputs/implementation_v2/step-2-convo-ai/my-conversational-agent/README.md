# ElevenLabs Conversational AI Demo

This project demonstrates how to integrate ElevenLabs Conversational AI into a Next.js application.

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following content:

   ```
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   NEXT_PUBLIC_AGENT_ID=your-agent-id
   ```

r

- Get your API key from the [ElevenLabs dashboard](https://elevenlabs.io/)
- Create an agent or use an existing agent ID from your ElevenLabs account

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- Real-time voice conversations with ElevenLabs AI agents
- Support for private agents via secured API endpoints
- Simple UI for starting and stopping conversations

## Requirements

- An ElevenLabs account with API access
- A web browser that supports WebRTC

## How It Works

The application connects to the ElevenLabs Conversational AI API using WebSockets. When a user starts a conversation:

1. The app requests microphone permission
2. For private agents, it fetches a signed URL from the server
3. It establishes a WebSocket connection to ElevenLabs
4. Users can speak and hear the AI agent's responses in real-time

## Notes

- Signed URLs expire after a short period, but active conversations will continue
- Make sure your microphone is working correctly
- For production use, implement proper error handling and retry logic
