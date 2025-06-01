# Kid Book Builder: Onboarding

## Child User Workflow: Onboarding & Story Initiation (Mermaid Diagram)

1. **Onboarding & Story Initiation**

   - Complete fun character creation quiz
   - Select story genre and theme
   - Choose storytelling format (fantasy, adventure, etc.)
   - Set up episode schedule and goals

   - <img src="images/child_onboarding_initiation.png" alt="Child User Workflow: Onboarding & Story Initiation" width="200">

2. **Story Creation Process**
   - Record story narration through guided prompts
   - Add details about characters and settings
   - Review and listen to recorded segments
   - Receive suggestions for story improvement
   - Save progress and continue later

## Character Creation Quiz Details

### Overview

The character creation quiz is an interactive voice chatbot experience designed to engage children in a natural conversation that helps shape their storytelling journey. The chatbot, acting as a friendly story guide, asks questions and responds to the child's answers to help develop their story's foundation.

### Voice Chatbot Interaction

- Friendly, age-appropriate AI personality that adapts its language to the child's age
- Natural conversation flow with follow-up questions based on previous answers
- Voice recognition optimized for children's speech patterns
- Option to repeat or rephrase questions if the child's response isn't clear

### Core Question Categories

1. **Tell Me Your Story Style**

   - What stories do you love? (favorite genres and themes)
   - How long should your story be? (short stories, chapter books)

2. **Design Your Story World**

   - Magic or Real World? (choose your world type)
   - Pick Your Setting (kingdoms, space, underwater, etc.)
   - When Does It Happen? (past, present, future)
   - Weather & Places (environment details)

3. **Create Your Characters**

   - Your Hero's Personality (traits and qualities)
   - Friends & Family (supporting characters)
   - Special Powers (abilities and skills)
   - Hero's Challenges (fears and obstacles)

4. **Choose Your Adventure**
   - Type of Quest (mystery, discovery, journey)
   - Friendship & Feelings (emotional elements)
   - Challenges to Face (puzzles, battles, problems)
   - How It Ends (story outcome)

<img src="images/character_creation_quiz_flow_v6.png" alt="Character Creation Quiz Workflow" width="1200">

### Output: Story Guide

The quiz generates a personalized story guide that includes:

- Character profile with personality traits and abilities
- Recommended story genres and themes
- Suggested plot elements and story arcs
- Visual representation of the story worlda
- List of potential supporting characters
- Story structure recommendations based on age and preferences

### Adaptive Features

- Adjusts question complexity based on child's age and responses
- Offers encouragement and positive reinforcement
- Provides examples and suggestions when children need help
- Allows for story guide modifications as preferences evolve

## Appendix: Mermaid Code

### Child User Workflow: Onboarding & Story Initialization

```mermaid
flowchart TD
    A[Start: Character Creation Quiz] --> B[Select Story Genre & Theme]
    B --> C[Choose Storytelling Format]
    C --> D[Set Up Episode Schedule & Goals]
    D --> E[Begin Story Creation]
```

### Character Creation Quiz Workflow

```mermaid
flowchart TD
    A[Meet Your Story Friend!] --> B[Tell Me Your Story Style]
    B --> C[Design Your World]
    C --> D[Create Your Characters]
    C --> E[Pick Your Adventure Type]

    subgraph Story_Style[Tell Me Your Story Style]
        B1[What stories do you love?]
        B2[How long should your story be?]
    end

    subgraph World_Design[Design Your Story World]
        C1[Magic or Real World?]
        C2[Pick Your Setting]
        C3[When Does It Happen?]
        C4[Weather & Places]
    end

    subgraph Characters[Create Your Characters]
        D1[Your Hero's Personality]
        D2[Friends & Family]
        D3[Special Powers]
        D4[Hero's Challenges]
    end

    subgraph Adventure[Choose Your Adventure]
        E1[Type of Quest]
        E2[Friendship & Feelings]
        E3[Challenges to Face]
        E4[How It Ends]
    end

    B --> Story_Style
    C --> World_Design
    D --> Characters
    E --> Adventure

    style A fill:#f9d5e5,stroke:#333,stroke-width:2px
    style B fill:#ffe6e6,stroke:#333,stroke-width:2px
    style C fill:#e6f3ff,stroke:#333,stroke-width:2px
    style D fill:#e6ffe6,stroke:#333,stroke-width:2px
    style E fill:#fff2e6,stroke:#333,stroke-width:2px

    style Story_Style fill:#ffe6e6,stroke:#333,stroke-width:1px
    style World_Design fill:#e6f3ff,stroke:#333,stroke-width:1px
    style Characters fill:#e6ffe6,stroke:#333,stroke-width:1px
    style Adventure fill:#fff2e6,stroke:#333,stroke-width:1px

    style B1 fill:#ffe6e6,stroke:#333,stroke-width:1px
    style B2 fill:#ffe6e6,stroke:#333,stroke-width:1px

    style C1 fill:#e6f3ff,stroke:#333,stroke-width:1px
    style C2 fill:#e6f3ff,stroke:#333,stroke-width:1px
    style C3 fill:#e6f3ff,stroke:#333,stroke-width:1px
    style C4 fill:#e6f3ff,stroke:#333,stroke-width:1px

    style D1 fill:#e6ffe6,stroke:#333,stroke-width:1px
    style D2 fill:#e6ffe6,stroke:#333,stroke-width:1px
    style D3 fill:#e6ffe6,stroke:#333,stroke-width:1px
    style D4 fill:#e6ffe6,stroke:#333,stroke-width:1px

    style E1 fill:#fff2e6,stroke:#333,stroke-width:1px
    style E2 fill:#fff2e6,stroke:#333,stroke-width:1px
    style E3 fill:#fff2e6,stroke:#333,stroke-width:1px
    style E4 fill:#fff2e6,stroke:#333,stroke-width:1px
```
