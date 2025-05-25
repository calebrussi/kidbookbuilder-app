# Agent Files Organization Guide

This document explains the organized structure for KidBookBuilder agent files.

## Directory Structure

```
/agents
  /standard           # Production-ready agent JSON files
  /config             # Configuration files used by agents
  /legacy             # Legacy agent files for reference
  /beta               # Development/beta versions 
  /archives           # Archived versions and backups
  /outputs            # Generated output files from ElevenLabs API
```

## File Naming Conventions

All agent files follow consistent naming patterns:

- **Standard agent files:** `<purpose>_agent.json`
  - Example: `hero_challenges_agent.json`
  - Location: `/agents/standard/`

- **Configuration files:** `<purpose>_config.json` 
  - Example: `hero_challenges_config.json`
  - Location: `/agents/config/`

- **Beta versions:** `<purpose>_beta.json`
  - Example: `hero_challenges_beta.json`
  - Location: `/agents/beta/`

- **Legacy files:** Various naming conventions
  - Location: `/agents/legacy/`

- **Archived versions:** `<purpose>_agent_<timestamp>.json`
  - Example: `hero_challenges_agent_2025-05-24T19-54-13-985Z.json`
  - Location: `/agents/archives/`

## Symbolic Links

For backward compatibility and convenience, symbolic links to the standard agent files are maintained in the root `/agents/` directory. These links point to the actual files in `/agents/standard/`.

## Organization Script

The `organize_agents.sh` script:
1. Creates the directory structure
2. Copies files to appropriate locations based on naming patterns
3. Creates symbolic links for backward compatibility
4. Preserves original files until you confirm the new structure works correctly

## Agent Management with the New Structure

### Creating/Updating Agents

When creating or updating agents, modify the files in `/agents/standard/` directory and use:

```bash
node createElevenLabsAgent.js agents/standard/agent_name.json
```

### Listing Agents

The `list_agents.js` script has been updated to recognize the new directory structure:

```bash
node list_agents.js
```

### Deleting Agents

Delete one or more agents using:

```bash
node delete_agents.js "agent_name1" "agent_name2" 
```

## Best Practices

1. **Keep standard agents clean**: Only production-ready agents should be in `/agents/standard/`
2. **Version control**: Before major changes, copy the current version to `/agents/archives/`
3. **Beta development**: Use `/agents/beta/` for experimental features
4. **Configuration separation**: Keep configuration files separate in `/agents/config/`
5. **Output management**: Agent API responses should go to `/agents/outputs/`

## Migration Notes

The organization script creates copies of files in the new structure. The original files remain in place until you verify everything works correctly. After verification, you can move the originals to `/agents/archives/originals/`.
