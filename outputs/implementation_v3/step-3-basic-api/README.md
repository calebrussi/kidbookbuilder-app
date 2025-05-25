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
node agentList.js
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

### Get Agent

Retrieves details of a specific ElevenLabs agent and saves the results to the `outputs` folder.

```
npm run get
```

You can also run it directly:

```
node agentGet.js
```

By default, the script will use a predefined agent ID, but you can specify a different one by modifying the script.

### Create Agent

Creates a new ElevenLabs agent using a configuration file and saves the result to the `outputs` folder.

```
npm run create
```

You can also run it directly:

```
node agentCreate.js
```

The script will read agent configuration from the `input/agent_create_1.json` file by default.

### Update Agent

Updates an existing ElevenLabs agent with new configuration settings.

```
npm run update
```

You can also run it directly:

```
node agentUpdate.js
```

You'll need to specify the agent ID to update in the script and provide the updated configuration.

### Delete Agent

Deletes a specific ElevenLabs agent from your account.

```
npm run delete
```

You can also run it directly:

```
node agentDelete.js
```

By default, the script will use a predefined agent ID, but you can specify a different one by modifying the script.

### Complete CRUD Operations

Performs a complete Create, Read, Update, Delete sequence on an ElevenLabs agent.

```
npm run crud
```

You can also run it directly:

```
node agentCRUD.js
```

This script demonstrates a full lifecycle of agent operations:

1. Creates a new agent
2. Retrieves the agent details
3. Updates the agent configuration
4. Lists all agents including the updated one
5. Deletes the agent

## API Documentation

For more details about the ElevenLabs API endpoints, refer to:

- [List Agents](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/list)
- [Create Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/create)
- [Get Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/get)
- [Update Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/update)
- [Delete Agent](https://elevenlabs.io/docs/conversational-ai/api-reference/agents/delete)
