# Managing Duplicate Agents in KidBookBuilder

## Issue Overview

The ElevenLabs platform currently shows multiple setting-related agents:
- `setting_type_agent`
- `story_setting_agent`

In some cases, there also appear to be duplicate copies of the same agent with identical names but different IDs.

## Solution Implemented

I've created three utility scripts to help manage and resolve the duplicate agent issues:

### 1. List Agent Inventory (`list_agents.js`)

This script provides a comprehensive inventory of agents both on ElevenLabs and in your local files:

- Lists all agents on the ElevenLabs platform with their IDs and creation dates
- Lists all agent JSON files in your local directory
- Identifies missing local files for existing remote agents
- Identifies missing remote agents for existing local files
- Saves a detailed report in markdown format

Run it with:
```bash
node list_agents.js
```

### 2. Deduplicate Agents (`deduplicate_agents.js`)

This script helps you identify and remove duplicate agents with the same name:

- Lists all duplicate agents found on the ElevenLabs platform
- Provides a date-sorted list of duplicate agent versions
- Lets you interactively choose to delete duplicates
- Always keeps the most recently created version
- Generates a report of deleted agents

Run it with:
```bash
node deduplicate_agents.js
```

### 3. Enhanced Agent Creation (`create_all_agents.js`)

The updated agent creation script now handles duplicates better:

- Added a `DUPLICATE_AGENTS` mapping to specify which agent names should be replaced
- Default mapping sets `story_setting_agent` to be replaced by `setting_type_agent`
- Detects and properly handles duplicates during the agent creation process
- Ensures only one version of each agent is maintained

Run it with:
```bash
node create_all_agents.js
```

## Next Steps

1. First, run the `list_agents.js` script to get a complete inventory of your agents:
   ```bash
   node list_agents.js
   ```

2. If duplicates are found, use the `deduplicate_agents.js` script to clean them up:
   ```bash
   node deduplicate_agents.js
   ```

3. Finally, deploy your updated agents with the enhanced `create_all_agents.js` script:
   ```bash
   node create_all_agents.js
   ```

This process will ensure that all your agents are properly configured with the latest formats and that duplicate agents are handled correctly.

## Agent Management Best Practices

1. Always use the `list_agents.js` script before deployment to see the current state
2. Run the `deduplicate_agents.js` script periodically to clean up duplicates
3. If you need to rename an agent, update the `DUPLICATE_AGENTS` mapping in `create_all_agents.js`
4. Update the `update_agents.sh` script if you need bash-based deployment
5. Keep all agent files in the standard format with proper `conversation_config` sections
