#!/bin/bash
# filepath: /Users/calebrussi/Sites/Proj_KidBookBuilder/outputs/implementation_v2/step-3-prompt-orchestration/fix_setting_agents.sh

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 ${YELLOW}Starting setting agent fix process...${NC}"

# Check if ELEVENLABS_API_KEY is set
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "${RED}Error: ELEVENLABS_API_KEY environment variable is not set${NC}"
  echo "Please set it using: export ELEVENLABS_API_KEY=your_api_key"
  exit 1
fi

# First step: Remove duplicate story_setting_agent
echo "👉 ${YELLOW}Step 1: Removing duplicate story_setting_agent...${NC}"
node remove_duplicate_setting_agent.js

# Check if the removal was successful
if [ $? -ne 0 ]; then
  echo "${RED}Error removing duplicate story_setting_agent${NC}"
  exit 1
fi

echo ""
echo "👉 ${YELLOW}Step 2: Verifying setting_type_agent.json${NC}"
if [ -f "agents/setting_type_agent.json" ]; then
  # Check if the file contains conversation_config
  if grep -q "conversation_config" "agents/setting_type_agent.json"; then
    echo "${GREEN}✅ setting_type_agent.json file is valid${NC}"
  else
    echo "${RED}⚠️ setting_type_agent.json is missing conversation_config section${NC}"
    exit 1
  fi
else
  echo "${RED}⚠️ setting_type_agent.json file not found${NC}"
  exit 1
fi

echo ""
echo "👉 ${YELLOW}Step 3: Deploying updated setting_type_agent...${NC}"
node createElevenLabsAgent.js setting_type_agent.json

# Check if the deployment was successful
if [ $? -ne 0 ]; then
  echo "${RED}Error deploying setting_type_agent${NC}"
  exit 1
fi

echo ""
echo "🎉 ${GREEN}Setting agent fix process completed!${NC}"
echo "You now have only a single setting agent: setting_type_agent"

# Generate a summary log
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
LOG_FILE="setting_agent_fix_${TIMESTAMP}.log"

cat > "$LOG_FILE" << EOL
# Setting Agent Fix Log

- Date: $(date)
- Actions:
  1. Removed duplicate "story_setting_agent"
  2. Verified "setting_type_agent.json" configuration
  3. Deployed updated "setting_type_agent"

To verify the changes, run:
\`\`\`
node list_agents.js
\`\`\`
EOL

echo "📝 Log file created: $LOG_FILE"
