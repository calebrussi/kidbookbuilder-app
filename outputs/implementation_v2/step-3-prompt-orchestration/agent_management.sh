#!/bin/bash
# filepath: /Users/calebrussi/Sites/Proj_KidBookBuilder/outputs/implementation_v2/step-3-prompt-orchestration/agent_management.sh

# Display script usage information
cat << EOF
=== ElevenLabs Agent Management ===

This script provides help for managing your ElevenLabs agents.

First, set your API key: 
export ELEVENLABS_API_KEY=your_api_key_here

Available commands:

1. Delete one or more agents by name:
   node delete_agents.js "agent_name1" "agent_name2" ...
   
   Example: node delete_agents.js "story_setting_agent" "world_type_agent"

2. Create or update an agent from a JSON file:
   node createElevenLabsAgent.js agent_file.json
   
   Example: node createElevenLabsAgent.js setting_type_agent.json

3. List all agents and their IDs:
   node list_agents.js

4. Create all agents from JSON files:
   node create_all_agents.js

5. Save output files when creating agents:
   export SAVE_OUTPUT=true
   node createElevenLabsAgent.js agent_file.json
   
   Note: By default, no output JSON files are created

6. Deploy legacy agents (story_length, types_of_stories_you_love, world_type_agent):
   node deploy_legacy_agents.js
   
7. Verify agent standardization:
   node verify_agent_standardization.js
   
EOF
