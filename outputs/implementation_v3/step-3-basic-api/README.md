# ElevenLabs Agent API Scripts

This directory contains scripts for interacting with the ElevenLabs Conversational AI Agent API.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file or rename `.env.example` to `.env`
   - Add your ElevenLabs API key:
     ```
     ELEVEN_LABS_API_KEY=your_api_key_here
     ```

## Available Scripts

### List Agents

Lists all available ElevenLabs agents for your account and saves the results to the `outputs` folder.

```
npm run list
```

You can also run it directly:

```
node listAgents.js
```

The script will:

1. Create an `outputs` directory if it doesn't exist
2. Save the complete API response as a timestamped JSON file (e.g., `agents-list-2025-05-25T12-34-56-789Z.json`)
3. Display a summary of agents in the console

#### Optional Query Parameters

You can modify the script to use these parameters:

- `pageSize`: Number of agents to return (default: 30, max: 100)
- `search`: Search term to filter agents by name
- `cursor`: Cursor for pagination

## API Documentation

For more details about the ElevenLabs API endpoints, refer to:

- [List Agents](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/list)
- [Create Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/create)
- [Get Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/get)
- [Update Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/update)
- [Delete Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/delete)
