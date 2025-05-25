# Agent Files Organization Guide

This document explains the organization of agent files in the KidBookBuilder project.

## Directory Structure

The agent files are now organized in a structured way to make maintenance and updates easier:

```
/agents
  /production      # Final, standardized agent files used in production
  /configs         # Configuration files for agents (non-deployable)
  /development     # Beta/in-progress agent files
  /archive         # Older versions and timestamped backups
  /outputs         # Generated output files from API calls
  README.md        # Documentation about the directory structure
```

## How to Use This Structure

### Deploying Agents

When deploying agents to ElevenLabs, use the production directory:

```bash
node createElevenLabsAgent.js agents/production/agent_name.json
```

### Listing Agents

The `list_agents.js` script has been updated to work with the new directory structure:

```bash
# List all agents
node list_agents.js

# List only production agents
node list_agents.js --dir=production

# List agents in development
node list_agents.js --dir=development
```

### Development Workflow

1. Start by creating or modifying agent files in the `development` directory
2. Test and refine the agent configuration
3. Once ready for production, move the file to the `production` directory
4. Deploy the agent using the `createElevenLabsAgent.js` script

### File Naming Conventions

- Production agents: `<purpose>_agent.json` (e.g., `hero_challenges_agent.json`)
- Configuration files: `<purpose>_config.json` (e.g., `hero_challenges_config.json`)
- Development files: `<purpose>_beta.json` or `<purpose>_dev.json`
- Archive files: Various formats including `.json.bak` and timestamped files

## Script Usage

### Organizing Files

The `organize_agents.sh` script was used to create this directory structure. If you need to reorganize files again:

```bash
bash organize_agents.sh
```

### Deploying Agents

The `create_all_agents.js` script can be used to deploy all production agents at once:

```bash
# Update the script to use the production directory
node create_all_agents.js --dir=production
```

### Deleting Agents

The `delete_agents.js` script can handle multiple agents:

```bash
node delete_agents.js "story_setting_agent" "world_type_agent"
```

## Benefits of This Organization

1. **Clear Separation of Concerns**: Production files are separate from development files
2. **Version Control**: Archive directory keeps backups of previous versions
3. **Reduced Clutter**: API outputs are stored separately from source files
4. **Improved Workflow**: Easier to find and work with the right files
5. **Documentation**: README files explain the purpose and usage of each directory

## Recommended Next Steps

1. Update scripts to use the new directory structure by default
2. Consider implementing version control (git) for the agent files
3. Create a deployment workflow that moves files from development to production
4. Add validation scripts to ensure agent files follow the required format
