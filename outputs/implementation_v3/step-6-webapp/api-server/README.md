# Todo API Server

A basic Express.js API server that provides endpoints for workflow and conversation management in the todo application. Includes ElevenLabs API integration for conversation retrieval.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Add your ElevenLabs API key to the `.env` file:

```bash
ELEVEN_LABS_API_KEY=your_actual_ELEVEN_LABS_API_KEY_here
```

4. Start the development server:

```bash
npm run dev
```

Or start the production server:

```bash
npm start
```

## API Endpoints

### Health Check

- **GET** `/health` - Server health status

### Workflow Management

- **GET** `/api/workflow` - Get current workflow state and steps

### Conversation Management

- **GET** `/api/conversation/:conversationId` - Get conversation details from ElevenLabs API
  - **Parameters:**
    - `conversationId` (required): The ElevenLabs conversation ID
  - **Response:** Returns conversation data including transcript, metadata, and audio flags
  - **Errors:**
    - 400: Missing conversationId
    - 401: Invalid ElevenLabs API key
    - 404: Conversation not found
    - 502: ElevenLabs API error

## Example Usage

### Get Workflow

```bash
curl http://localhost:3001/api/workflow
```

### Get Conversation

```bash
# Replace 'your-conversation-id' with an actual ElevenLabs conversation ID
curl http://localhost:3001/api/conversation/your-conversation-id
```

### Example Response

```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "agentId": "agent-456",
    "status": "done",
    "startTime": "2025-05-26T10:30:00.000Z",
    "endTime": "2025-05-26T10:35:00.000Z",
    "transcript": [
      {
        "role": "user",
        "time_in_call_secs": 0,
        "message": "Hello, how are you?"
      },
      {
        "role": "assistant",
        "time_in_call_secs": 2,
        "message": "Hello! I'm doing well, thank you for asking."
      }
    ],
    "metadata": {
      "totalMessages": 2,
      "duration": 300000,
      "lastActivity": "2025-05-26T10:35:00.000Z",
      "hasAudio": true,
      "hasUserAudio": true,
      "hasResponseAudio": true
    }
  },
  "message": "Conversation retrieved successfully from ElevenLabs"
}
```

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": object,
  "message": string,
  "error"?: string
}
```

## Development

- The server runs on port 3001 by default
- CORS is enabled for frontend development
- ElevenLabs conversation endpoint is fully implemented
- Workflow endpoint is currently stubbed with sample data
- Use `npm run dev` for auto-restart during development

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `ELEVEN_LABS_API_KEY`: Your ElevenLabs API key (required for conversation endpoint)

## TODO

- [ ] Implement actual workflow storage and retrieval
- [ ] Add authentication/authorization
- [ ] Add input validation middleware
- [ ] Add rate limiting
- [ ] Add database integration
- [ ] Add comprehensive tests
- [ ] Add logging middleware
