# Environment Configuration

This document outlines the environment variables required for Phase 2 of the Kid Book Builder project.

## Required Variables

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `DB_CONNECTION_STRING` | Database connection URL | `mongodb://localhost:27017/kidbook` |
| `API_SECRET_KEY` | Secret key for API authentication | `your-secret-key-here` |
| `STORAGE_ROOT` | Root directory for content storage | `./storage` |
| `PORT` | Port for the API server | `3000` |
| `CLIENT_PORT` | Port for the client application | `3001` |
| `LOG_LEVEL` | Logging level | `info` |

## Configuration Files

Environment variables can be set in a `.env` file in the root of the phase2 directory. An example template is provided in `.env.example`.

## Development vs. Production

Different configurations are used based on the `NODE_ENV` environment variable:

- `development`: Uses local storage and development database
- `test`: Uses in-memory storage and test database
- `production`: Uses cloud storage and production database

## Secret Management

Never commit sensitive environment variables to source control. Use environment-specific configuration management for production deployments. 