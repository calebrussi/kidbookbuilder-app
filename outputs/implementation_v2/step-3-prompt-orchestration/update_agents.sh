#!/bin/bash

# Check if ELEVENLABS_API_KEY is set
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Error: ELEVENLABS_API_KEY environment variable is not set"
  echo "Please set it using: export ELEVENLABS_API_KEY=your_api_key"
  exit 1
fi

# Define the ElevenLabs API URL for agents
AGENTS_API="https://api.elevenlabs.io/v1/convai/agents"

# Get a list of existing agents to find agent IDs
echo "Fetching existing agents..."
AGENTS_RESPONSE=$(curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" "$AGENTS_API")

# Check if the curl request was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch agents from ElevenLabs API"
  exit 1
fi

# Directory containing agent JSON files
AGENTS_DIR="/Users/calebrussi/Sites/Proj_KidBookBuilder/outputs/implementation_v2/step-3-prompt-orchestration/agents"

# Function to update an agent
update_agent() {
  AGENT_FILE="$1"
  AGENT_NAME=$(grep -o '"name": *"[^"]*"' "$AGENT_FILE" | head -1 | cut -d '"' -f 4)
  
  if [ -z "$AGENT_NAME" ]; then
    echo "Warning: Could not find agent name in $AGENT_FILE, skipping..."
    return
  fi
  
  echo "Processing agent: $AGENT_NAME from file: $AGENT_FILE"
  
  # Check if the agent exists
  AGENT_ID=$(echo "$AGENTS_RESPONSE" | grep -o "\"agent_id\":\"[^\"]*\",\"name\":\"$AGENT_NAME\"" | cut -d '"' -f 4)
  
  if [ -n "$AGENT_ID" ]; then
    echo "Found existing agent with name '$AGENT_NAME' and ID: $AGENT_ID"
    echo "Deleting existing agent..."
    
    DELETE_RESPONSE=$(curl -s -X DELETE -H "xi-api-key: $ELEVENLABS_API_KEY" "$AGENTS_API/$AGENT_ID")
    
    if [ $? -ne 0 ]; then
      echo "Warning: Failed to delete agent $AGENT_NAME (ID: $AGENT_ID)"
    else
      echo "Successfully deleted agent $AGENT_NAME"
    fi
  else
    echo "No existing agent found with name '$AGENT_NAME', will create new"
  fi
  
  # Create the agent
  echo "Creating agent $AGENT_NAME..."
  CREATE_RESPONSE=$(curl -s -X POST -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" -d @"$AGENT_FILE" "$AGENTS_API/create")
  
  # Check if creation was successful
  if echo "$CREATE_RESPONSE" | grep -q "agent_id"; then
    NEW_AGENT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"agent_id":"[^"]*"' | cut -d'"' -f4)
    echo "Successfully created agent $AGENT_NAME with ID: $NEW_AGENT_ID"
  else
    echo "Failed to create agent $AGENT_NAME"
    echo "API Response: $CREATE_RESPONSE"
  fi
  
  echo "-----------------------------------"
}

# Process all agent files in the directory
for AGENT_FILE in "$AGENTS_DIR"/*.json; do
  # Skip any files that contain "beta" or "config" in their name
  if [[ "$AGENT_FILE" != *beta* ]] && [[ "$AGENT_FILE" != *clean* ]]; then
    update_agent "$AGENT_FILE"
  fi
done

echo "Agent update process completed!"
