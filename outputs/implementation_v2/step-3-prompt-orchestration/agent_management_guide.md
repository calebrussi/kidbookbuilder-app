# KidBookBuilder AI Agent Management Guide

This document provides comprehensive information on managing AI agents for the KidBookBuilder project.

## Overview

The KidBookBuilder project uses ElevenLabs AI agents to facilitate interactive storytelling experiences for children. Each agent serves a specific purpose in the story creation process, collecting information about different aspects of the story the child wants to create.

## Agent Structure

All agents follow a standardized structure:

```json
{
  "name": "agent_name",
  "conversation_config": {
    "asr": { /* Audio settings */ },
    "turn": { /* Turn management */ },
    "tts": { /* Text-to-speech settings */ },
    "conversation": { /* Conversation parameters */ },
    "agent": { /* Agent behavior and prompt */ }
  },
  "platform_settings": {
    "auth": { /* Authentication settings */ },
    "evaluation": { /* Evaluation criteria */ },
    "data_collection": { 
      /* Data fields as string types - required by ElevenLabs API */ 
    }
  }
}
```

Key points about the structure:
- All agent files are stored in the `agents` directory
- All data collection fields must use the `string` type as required by ElevenLabs API
- Each agent has a unique name and purpose

## Available Agents

The KidBookBuilder project uses the following agents:

### Story Structure Agents
1. `story_length` - Determines preferred story length (short, medium, long)
2. `types_of_stories_you_love` - Identifies child's favorite story types/genres
3. `story_ending_agent` - Helps craft how the story should end

### Character Development Agents
1. `hero_challenges_agent` - Defines obstacles and challenges for the hero
2. `special_powers_agent` - Creates unique abilities for characters
3. `supporting_characters_agent` - Develops secondary characters
4. `personality_selection_agent` - Designs hero's character traits

### World Building Agents
1. `setting_type_agent` - Establishes the story's setting
2. `world_type_agent` - Defines the type of world for the story
3. `time_period_selection_agent` - Selects historical/future period
4. `weather_places_agent` - Defines environment details

### Plot Development Agents
1. `quest_type_agent` - Establishes the main quest/goal
2. `challenges_to_face_agent` - Creates obstacles and challenges
3. `friendship_feelings_agent` - Develops emotional elements

## Agent Management Scripts

### 1. Listing Agents
```bash
node list_agents.js
```
This script:
- Lists all agents on ElevenLabs platform
- Lists all agents in local files
- Identifies mismatches between local and remote agents
- Generates a comprehensive inventory report

### 2. Creating/Updating Agents
```bash
node createElevenLabsAgent.js agents/agent_name.json
```
This script:
- Deletes existing agent with the same name (if any)
- Creates a new agent from the specified JSON file
- Optionally saves output details (when SAVE_OUTPUT=true)

### 3. Creating All Agents
```bash
node create_all_agents.js
```
This script:
- Deploys all agent JSON files from the agents directory
- Handles duplicate checking and removal
- Reports on successful and failed deployments

### 4. Deleting Agents
```bash
node delete_agents.js "agent_name1" "agent_name2" "agent_name3"
```
This script:
- Deletes one or more agents by name from ElevenLabs
- Provides a summary of successful and failed deletions

### 5. Deploying Legacy Agents
```bash
node deploy_legacy_agents.js
```
This script:
- Creates or updates the legacy agents (story_length, types_of_stories_you_love, world_type_agent)
- Handles duplicate checking and removal
- Reports on successful and failed deployments

## Common Workflows

### Adding a New Agent

1. Create an agent JSON file in the `agents` directory following the standard format
2. Deploy the agent using:
   ```bash
   node createElevenLabsAgent.js agents/new_agent.json
   ```

### Updating an Existing Agent

The process is identical to adding a new agent. The script automatically deletes any existing agent with the same name before creating the updated version.

### Managing Duplicate Agents

If duplicate agents are found on the ElevenLabs platform (agents with the same name):
1. Use `list_agents.js` to identify the duplicates
2. Use `delete_agents.js` to remove the unwanted instances
3. Use `createElevenLabsAgent.js` to redeploy the correct version

## Troubleshooting

### API Key Issues
- Ensure the ELEVENLABS_API_KEY environment variable is set
- Verify the API key is valid by testing with a simple GET request

### File Structure Issues
- Ensure all agent JSON files have the correct structure
- Verify all data_collection fields use the "string" type
- Make sure the agent name is specified correctly

### Deployment Failures
- Check network connectivity
- Verify API call response for detailed error messages
- Check for rate limiting issues with the ElevenLabs API

## Best Practices

1. **Always run `list_agents.js` before and after major changes** to ensure agents are properly deployed and no duplicates exist
2. **Use descriptive agent names** that clearly indicate their purpose
3. **Ensure data_collection fields use the string type** as required by ElevenLabs API
4. **Keep first_message and prompts child-friendly** and age-appropriate
5. **Document any special handling needed** for specific agents

## Future Improvements

1. Add better error handling and reporting
2. Create a unified management interface
3. Implement versioning for agent configurations
4. Add bulk operations for agent management

## Conclusion

This standardized approach to agent management ensures consistency across all KidBookBuilder AI agents and simplifies the process of creating, updating, and managing them.
