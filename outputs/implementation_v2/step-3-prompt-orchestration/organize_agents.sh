#!/bin/bash

# Set the base directory
BASE_DIR="/Users/calebrussi/Sites/Proj_KidBookBuilder/outputs/implementation_v2/step-3-prompt-orchestration"
AGENTS_DIR="$BASE_DIR/agents"

echo "=== KidBookBuilder Agent Files Organizer ==="
echo "This script will organize your agent files into a structured directory layout."

# Create directory structure if it doesn't exist
echo "Creating directory structure..."
mkdir -p "$AGENTS_DIR/production" "$AGENTS_DIR/configs" "$AGENTS_DIR/development" "$AGENTS_DIR/archive" "$AGENTS_DIR/outputs"
mkdir -p "$AGENTS_DIR/archive/originals"  # For original files backup

# Counters for file movement statistics
PROD_COUNT=0
CONFIG_COUNT=0
DEV_COUNT=0
ARCHIVE_COUNT=0
OUTPUT_COUNT=0

# Move standard agent files
echo "Moving production agent files..."
for file in "$AGENTS_DIR"/*_agent.json "$AGENTS_DIR"/*length.json "$AGENTS_DIR"/*love.json "$AGENTS_DIR"/world_type_agent.json; do
  if [ -f "$file" ]; then
    base=$(basename "$file")
    # Skip if the file is a timestamped version
    if [[ ! "$base" =~ .*_[0-9]{4}-[0-9]{2}-[0-9]{2}T.* ]]; then
      echo "  Moving $base to production/"
      cp "$file" "$AGENTS_DIR/production/$base"
      PROD_COUNT=$((PROD_COUNT + 1))
    fi
  fi
done

# Move config files
echo "Moving configuration files..."
for file in "$AGENTS_DIR"/*_config.json; do
  if [ -f "$file" ]; then
    base=$(basename "$file")
    echo "  Moving $base to configs/"
    cp "$file" "$AGENTS_DIR/configs/$base"
    CONFIG_COUNT=$((CONFIG_COUNT + 1))
  fi
done

# Move beta files and development files
echo "Moving development files..."
for file in "$AGENTS_DIR"/*_beta.json "$AGENTS_DIR"/*_dev.json; do
  if [ -f "$file" ]; then
    base=$(basename "$file")
    echo "  Moving $base to development/"
    cp "$file" "$AGENTS_DIR/development/$base"
    DEV_COUNT=$((DEV_COUNT + 1))
  fi
done

# Move timestamped/archived files
echo "Moving output files..."
for file in "$AGENTS_DIR"/*_[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*.json; do
  if [ -f "$file" ]; then
    base=$(basename "$file")
    echo "  Moving $base to outputs/"
    cp "$file" "$AGENTS_DIR/outputs/$base"
    OUTPUT_COUNT=$((OUTPUT_COUNT + 1))
  fi
done

# Move any files with "clean" in the name or backup files to archive
echo "Moving archived files..."
for file in "$AGENTS_DIR"/*clean*.json "$AGENTS_DIR"/*.json.bak; do
  if [ -f "$file" ]; then
    base=$(basename "$file")
    echo "  Moving $base to archive/"
    cp "$file" "$AGENTS_DIR/archive/$base"
    ARCHIVE_COUNT=$((ARCHIVE_COUNT + 1))
  fi
done

echo "Creating symbolic links for convenience..."

# Creating symlinks for all production agents
for file in "$AGENTS_DIR/production"/*.json; do
  if [ -f "$file" ]; then
    base=$(basename "$file")
    echo "  Creating symlink for $base"
    ln -sf "production/$base" "$AGENTS_DIR/$base"
  fi
done

# Create a README file explaining the directory structure
echo "Creating README file..."
cat > "$AGENTS_DIR/README.md" << 'EOF'
# KidBookBuilder Agents Directory Structure

This directory contains the agent configuration files for the KidBookBuilder project.

## Directory Organization

- **production/** - Production-ready agent files that are standardized and deployed
- **configs/** - Configuration files that define agent behaviors but aren't deployable on their own
- **development/** - Beta versions and in-progress agent files
- **archive/** - Older versions of agent files and backups
- **outputs/** - Generated output files from API calls (timestamped)

## File Naming Conventions

- Production agents: `<purpose>_agent.json`
- Configuration files: `<purpose>_config.json`
- Development files: `<purpose>_beta.json` or `<purpose>_clean.json`
- Archive files: Various formats including `.json.bak`
- Output files: Files with timestamps in the format `<name>_YYYY-MM-DDThh-mm-ss.json`

## Usage

When creating or modifying agents, work with files in the `development` directory first, 
then move them to `production` when they're ready to be deployed.
EOF

# Verify the organization
echo ""
echo "=== Organization Summary ==="
echo ""
echo "Production Agents: $PROD_COUNT"
echo "Configuration Files: $CONFIG_COUNT"
echo "Development Files: $DEV_COUNT" 
echo "Archive Files: $ARCHIVE_COUNT"
echo "Output Files: $OUTPUT_COUNT"
echo ""
echo "Total Files Organized: $((PROD_COUNT + CONFIG_COUNT + DEV_COUNT + ARCHIVE_COUNT + OUTPUT_COUNT))"
echo ""

echo "Directory Structure:"
echo ""
echo "Production Agents ($PROD_COUNT):"
ls -la "$AGENTS_DIR/production/"

echo ""
echo "Configuration Files ($CONFIG_COUNT):"
ls -la "$AGENTS_DIR/configs/"

echo ""
echo "Development Files ($DEV_COUNT):"
ls -la "$AGENTS_DIR/development/"

echo ""
echo "Archive Files ($ARCHIVE_COUNT):"
ls -la "$AGENTS_DIR/archive/"

echo ""
echo "Output Files ($OUTPUT_COUNT):"
ls -la "$AGENTS_DIR/outputs/"

echo ""
echo "Root Directory (Symbolic Links):"
ls -la "$AGENTS_DIR"/*.json | grep -v "archive\|development\|configs\|outputs\|production"

echo ""
echo "=== Next Steps ==="
echo "IMPORTANT: This script created copies of your files in the new structure."
echo "The original files are still in the $AGENTS_DIR directory."
echo ""
echo "To complete the organization process:"
echo ""
echo "1. Verify that all files have been copied correctly"
echo "2. Run the following command to backup the original files:"
echo "   mv $AGENTS_DIR/*.json $AGENTS_DIR/archive/originals/"
echo ""
echo "3. Update your scripts to use the new file paths:"
echo "   - List agents: node list_agents.js --dir=production"
echo "   - Create agents: node createElevenLabsAgent.js agents/production/agent_name.json"
echo ""
echo "4. Remember to update the AGENTS_DIR variable in your scripts to:"
echo "   const AGENTS_DIR = path.join(__dirname, 'agents/production');"
