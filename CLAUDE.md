# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kid Book Builder is a creative storytelling web application for children ages 5-12. It transforms children's voice recordings into multi-format content (books, audio, video) through AI-powered agents and workflow orchestration.

## Core Architecture

### Main Applications
- **Primary App**: `outputs/web-app/v4/voice-step-flow/` - React/TypeScript frontend with Vite
- **Agent Orchestration**: `workflow-setup/` - Node.js scripts for agent management
- **API Integration**: ElevenLabs agents for voice processing and conversational AI

### Key Technologies
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State Management**: React Context, React Query
- **Backend**: Supabase (auth, database, real-time)
- **Voice Processing**: ElevenLabs API with WebSocket connections
- **Authentication**: Supabase Auth with user profiles

## Common Commands

### Main Application (outputs/web-app/v4/voice-step-flow/)
```bash
# Development
npm run dev

# Build for production
npm run build
npm run build:dev

# Linting
npm run lint

# API server (if needed)
npm run api-start
npm run api-dev
```

### Agent Management (workflow-setup/)
```bash
# Create workflow components
npm run 1  # Create prompt flow
npm run 2  # Create prompt config
npm run 3  # Create agent config
npm run 4  # Create agent
npm run 5  # Create workflow

# Cleanup
npm run promptCleanup
npm run agentCleanup
```

## Architecture Patterns

### Workflow System
- **Workflows**: Define multi-step user journeys (character creation, story building)
- **Agents**: ElevenLabs conversational AI agents for each step
- **Progress Tracking**: User progress stored in Supabase with real-time updates
- **Personalization**: Dynamic agent selection based on user responses

### Service Layer Structure
- `workflowService.ts` - Workflow loading and management
- `personalizedAgentService.ts` - Dynamic agent creation and selection
- `progressService.ts` - User progress tracking
- `supabaseProgressService.ts` - Database persistence
- `contextChainingService.ts` - Cross-step context preservation

### Data Flow
1. User completes workflow steps through voice interactions
2. Progress tracked in real-time via Supabase
3. Responses used to personalize subsequent agents
4. Context chained between steps for coherent experience

## Key Configuration

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_ELEVENLABS_API_KEY` - ElevenLabs API key

### Agent Configuration
- Agent templates: `workflow-setup/lib/agent/agent_template_default.json`
- Agent creation scripts: `workflow-setup/lib/agent/`
- Input configurations: `workflow-setup/inputs/`

## Development Workflow

### Working with Agents
1. Define workflow in input files (`workflow-setup/inputs/`)
2. Generate prompt flows with `npm run 1`
3. Create agent configurations with `npm run 2-4`
4. Test integration in main app

### Testing Progress System
- Use `ProgressDebugPanel` component for manual testing
- Debug page available at `/debug` route
- Real-time progress updates via Supabase subscriptions

### Authentication Flow
- Supabase Auth with email/password
- User profiles automatically created on sign up
- Auth state managed via React Context

## Important Notes

### Agent Management
- Agents are created dynamically based on user responses
- Static agents used as fallbacks when personalization fails
- Agent IDs are stored in workflow configurations

### Progress Persistence
- All user progress stored in Supabase `user_progress` table
- Progress includes responses, timestamps, and workflow state
- Real-time updates for multi-device sync

### Error Handling
- Graceful fallbacks for failed agent creation
- Offline support with local storage backup
- Comprehensive error logging for debugging

## Database Schema

### Core Tables
- `user_profiles` - User account information
- `user_progress` - Step completion tracking
- `workflows` - Workflow definitions
- `agents` - Agent configurations

### Key Relationships
- Users have progress records for each workflow step
- Workflows contain sections with ordered steps
- Each step references an agent for interaction