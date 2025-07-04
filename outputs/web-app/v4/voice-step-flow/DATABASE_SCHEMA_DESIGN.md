# Supabase Database Schema Design Documentation

## Overview

This document describes the database schema design for Phase 2 of the Kid Book Builder application: User-Scoped Data Management. The schema is designed to support personalized, user-specific workflow experiences with comprehensive progress tracking, conversation management, and data collection.

## Design Principles

### 1. User-Centric Architecture

- All data is scoped to individual users via Row Level Security (RLS)
- Each user gets their own isolated data space
- No data leakage between users

### 2. Workflow Flexibility

- Workflows are defined as reusable templates
- Users can have multiple sessions through the same workflow
- Support for different workflow versions and variations

### 3. Comprehensive Progress Tracking

- Track progress at multiple levels (overall, step-by-step)
- Capture timing, attempt counts, and success metrics
- Support for complex conversation flows

### 4. Rich Data Collection

- Flexible JSON storage for various data types
- Schema validation support
- AI analysis integration

### 5. Performance Optimization

- Strategic indexing for common queries
- Efficient foreign key relationships
- Automatic statistics updates via triggers

## Database Tables

### Core Tables

#### 1. `user_profiles`

Extends Supabase's built-in authentication with application-specific profile data.

**Key Features:**

- Links to `auth.users` via foreign key
- Stores display name and avatar
- Automatic timestamp management

**RLS Policies:**

- Users can only access their own profile
- Full CRUD permissions for own data

#### 2. `workflows`

Stores reusable workflow definitions that can be shared across users.

**Key Features:**

- Version support for workflow evolution
- JSON storage for complex workflow structure
- Tagging and categorization
- Difficulty levels and time estimates

**RLS Policies:**

- Public read access for active workflows
- Admin-only write access (not user-managed)

#### 3. `user_progress`

Tracks overall user progress through specific workflow instances.

**Key Features:**

- Unique session tracking (users can restart workflows)
- Real-time progress statistics
- Activity timestamps for engagement tracking
- Automatic completion percentage calculation

**RLS Policies:**

- Full user control over own progress data

#### 4. `step_progress`

Detailed tracking of individual step completion within workflows.

**Key Features:**

- Status tracking with multiple states
- Attempt counting for retry scenarios
- Conversation linking for voice interactions
- Flexible user input storage

**RLS Policies:**

- User-scoped access only

#### 5. `captured_data`

Stores all data collected during workflow execution.

**Key Features:**

- Multiple data type support (text, JSON, numbers)
- AI confidence scoring
- Source attribution (user, AI, system)
- Schema validation support

**RLS Policies:**

- User-scoped access only

#### 6. `conversation_messages`

Individual messages in conversations between users and AI agents.

**Key Features:**

- Proper message sequencing
- Multi-modal support (text, audio)
- Agent attribution
- Sentiment analysis integration

**RLS Policies:**

- User-scoped access only

#### 7. `conversation_analysis`

AI analysis results from conversations.

**Key Features:**

- Multiple analysis types
- Structured results storage
- Performance metrics
- Model version tracking

**RLS Policies:**

- User-scoped access only

## Data Relationships

```
auth.users (Supabase)
    ↓ (1:1)
user_profiles
    ↓ (1:many)
user_progress
    ↓ (1:many)
step_progress
    ↓ (1:many)
├── captured_data
├── conversation_messages
└── conversation_analysis

workflows (1:many) → user_progress
```

## Key Features

### 1. Row Level Security (RLS)

Every table implements comprehensive RLS policies ensuring:

- Users can only access their own data
- No accidental data exposure
- Secure multi-tenancy

### 2. Automatic Statistics

Triggers automatically maintain:

- Progress percentages
- Completion counts
- Activity timestamps
- Updated_at fields

### 3. Flexible JSON Storage

Strategic use of JSONB fields for:

- Workflow definitions
- User inputs
- Analysis results
- Schema validation

### 4. Performance Optimization

Carefully designed indexes for:

- User-scoped queries
- Conversation threading
- Progress tracking
- Time-based queries

### 5. Data Integrity

Comprehensive constraints ensure:

- Referential integrity
- Data validation
- Unique constraints where needed

## Views and Aggregations

### `user_progress_summary`

Joins user progress with workflow and profile information for dashboard displays.

### `step_progress_detailed`

Aggregates step progress with conversation and data collection counts.

## Migration Strategy

### From localStorage to Supabase

1. **Parallel Operation**: Run both systems during transition
2. **Data Migration**: Batch migrate existing localStorage data
3. **Gradual Cutover**: Switch features one at a time
4. **Fallback**: Maintain localStorage as backup during initial phase

### Compatibility Layer

- Legacy type definitions maintained
- Converter functions for existing code
- Gradual refactoring of components

## Usage Patterns

### 1. Starting a New Workflow Session

```sql
-- Create user progress record
INSERT INTO user_progress (user_id, workflow_id, session_id, current_step_id, total_steps)
VALUES ($1, $2, $3, $4, $5);

-- Initialize first step
INSERT INTO step_progress (user_id, user_progress_id, workflow_id, step_id, status)
VALUES ($1, $2, $3, $4, 'in_progress');
```

### 2. Capturing Conversation Data

```sql
-- Store message
INSERT INTO conversation_messages (user_id, step_progress_id, conversation_id, content, role)
VALUES ($1, $2, $3, $4, $5);

-- Store analysis
INSERT INTO conversation_analysis (user_id, step_progress_id, conversation_id, analysis_type, evaluation_criteria_results)
VALUES ($1, $2, $3, 'evaluation', $4);

-- Capture extracted data
INSERT INTO captured_data (user_id, step_progress_id, user_progress_id, label, value, source)
VALUES ($1, $2, $3, $4, $5, 'ai_analysis');
```

### 3. Querying User Progress

```sql
-- Get current session
SELECT * FROM user_progress_summary
WHERE user_id = $1 AND status = 'in_progress'
ORDER BY last_activity_at DESC
LIMIT 1;

-- Get step details with conversations
SELECT * FROM step_progress_detailed
WHERE user_progress_id = $1
ORDER BY created_at;
```

## Security Considerations

### Row Level Security

- All tables have user_id foreign keys
- RLS policies enforce user isolation
- No bypassing security at application level

### Data Privacy

- Personal data encrypted at rest
- Audit logging for sensitive operations
- GDPR-compliant data deletion

### API Security

- All queries filtered by authenticated user ID
- No direct table access from frontend
- Supabase handles authentication tokens

## Performance Considerations

### Indexing Strategy

- Primary indexes on user_id for all tables
- Secondary indexes on frequently queried fields
- Composite indexes for complex queries

### Query Optimization

- Views pre-aggregate commonly needed data
- Triggers maintain denormalized statistics
- Efficient pagination support

### Scaling Considerations

- Partitioning possible by user_id if needed
- Read replicas for analytics queries
- Connection pooling for high concurrency

## Future Enhancements

### Phase 3: Personalized Agent System

- Add `agents` table for user-specific agents
- Agent configuration and state management
- Dynamic agent creation workflows

### Phase 4: Story Generation

- Add `stories` and `story_chapters` tables
- Story versioning and publishing workflows
- Collaborative story features

### Analytics and Reporting

- Add `user_analytics` table
- Aggregate progress across users
- A/B testing support

## Implementation Checklist

- [x] Create database schema SQL file
- [x] Define TypeScript types
- [x] Create documentation
- [ ] Set up database migration scripts
- [ ] Implement Supabase service layer
- [ ] Create React hooks for data access
- [ ] Set up real-time subscriptions
- [ ] Implement data migration from localStorage
- [ ] Add comprehensive testing
- [ ] Performance optimization
- [ ] Security audit

## Next Steps

This schema design completes the first step of Phase 2. The next steps are:

1. **Create Supabase Tables**: Run the SQL schema in your Supabase project
2. **Implement Data Service Layer**: Create TypeScript services for database operations
3. **Add Real-time Subscriptions**: Implement progress sync across devices
4. **Migrate from localStorage**: Create migration utilities and processes
5. **Set up RLS Policies**: Ensure all security policies are properly configured

The schema is designed to be robust, scalable, and secure while maintaining compatibility with the existing application structure.
