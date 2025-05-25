# Phase 3 Environment Setup

This document outlines the environment setup for Phase 3 of the Kid Book Builder platform.

## Requirements

- Node.js (v16 or higher)
- npm (included with Node.js)

## Dependencies

The following dependencies are required for Phase 3:

- express - Web server framework
- react - UI library
- react-dom - React DOM renderer
- typescript - Type checking and compilation
- concurrently - Run multiple commands concurrently
- socket.io - WebSocket library for real-time collaboration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Verify environment:
   ```bash
   npm run verify-phase3
   ```

3. Start the development servers:
   ```bash
   npm run dev:phase3
   ```

## Environment Variables

Create a `.env` file in the phase3 directory with the following variables:

```
PORT=3000
CLIENT_PORT=3002
NODE_ENV=development
```

## Directory Structure

- `src/` - Source code
  - `api/` - API server code
  - `client/` - Client-side code
  - `models/` - Data models
  - `services/` - Service implementations
    - `collaboration/` - Collaborative editing service
    - `generation/` - Story generation service
    - `feedback/` - Feedback system service
    - `template/` - Template management service
- `config/` - Configuration files
- `docs/` - Documentation
- `scripts/` - Utility scripts
- `tests/` - Test files
- `examples/` - Example code
- `storage/` - Local storage for development 