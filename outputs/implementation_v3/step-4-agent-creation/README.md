# ElevenLabs Agent Creation Toolkit

This folder contains a set of scripts for creating and managing ElevenLabs conversational agents. These tools help automate the process of configuring, converting, and deploying agents for the KidBookBuilder application.

## Prerequisites

- Node.js installed
- Valid ElevenLabs API key (set in `.env` file as `ELEVEN_LABS_API_KEY`)
- OpenRouter API key (set in `.env` file as `OPENROUTER_API_KEY`) for the configuration generation

## Scripts Overview

### Script Execution Sequence

For a complete agent creation workflow, execute the scripts in this order:

1. **agent-config.js** - Generate agent configuration from a conversation node description
2. **agent-convert.js** - Convert the generated config to ElevenLabs format
3. **agent-create.js** - Create the agent in ElevenLabs using the converted config

### Detailed Script Documentation

#### 1. agent-config.js

Generates agent configuration based on a natural language description of the agent's purpose.

```bash
node agent-config.js
```

**Features:**

- Uses OpenRouter API to generate agent configuration from description
- Outputs configuration files in the `outputs` directory
- Can be imported as a module in other scripts

**Usage as a module:**

```javascript
const { convertNodeToAgentConfig } = require("./agent-config");

// Example usage
async function example() {
  const description = "Tell me about your favorite character";
  const config = await convertNodeToAgentConfig(description, {
    model: "anthropic/claude-3-haiku", // Optional model override
  });
}
```

#### 2. agent-convert.js

Converts agent configurations to make them compatible with ElevenLabs' requirements.

```bash
node agent-convert.js
```

**Features:**

- Takes configurations from `outputs/agent-config-result-*.json`
- Performs necessary transformations and validations
- Outputs ElevenLabs-ready configuration to `outputs/agent-convert-result-*.json`

#### 3. agent-create.js

Creates an agent in ElevenLabs using the converted configuration.

```bash
node agent-create.js [--keep-agent]
```

**Features:**

- Creates a new agent using the ElevenLabs API
- Verifies agent creation with get and list operations
- Optionally deletes the agent after creation (default behavior)
- Use `--keep-agent` flag to keep the agent after creation

**Usage as a module:**

```javascript
const { runAgentCreate } = require("./agent-create");

// Keep agent after creation
await runAgentCreate(false);
```

#### Other Scripts

- **openrouter-simple.js** - Simple demonstration of OpenRouter API usage

## Environment Variables

Create a `.env` file in this directory with the following variables:

```
ELEVEN_LABS_API_KEY=your_eleven_labs_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Directory Structure

- `prompts/` - Contains prompt templates used by the configuration scripts
- `outputs/` - Contains generated configuration files and API responses
- `images/` - Contains any visual assets used in the project
- `inputs/` - Contains input files for the scripts

## Development

To modify these scripts:

1. Each script can be run independently or as part of a pipeline
2. Core functionality has been modularized for reuse in other projects
3. Review the `.env.example` file for required environment variables
