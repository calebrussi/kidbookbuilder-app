I need a simple web UI that mimics a ToDo app, but uses a chat interface to complete tasks.

**IMPORTANT** I don't want the app to have any wired up functionality, just have a clean, functioning UI with state management.

The core component is a list of ordered steps to complete. Each step will have a short title. Clicking on a step should activate it. There can only be one active step at a time. They cannot activate new steps, but they can reactive previous steps. Each step should visually indicate the current state:

    * not_started is the initial state all steps are in.
    * in_progress is the active step being worked on.  There can only be one step in this state.
    * started is a step that has previously been worked on, but was not completed, and is not the active step.
    * complete is the final state for all steps.
    * error is a state to catch any technical errors that occur when the step is being worked on.

The current workflow should have a visible title (like Character Creation Quiz).

This web app should be responsive, especially for mobile. It should use TailwindCSS. It should use ReactJS.

There will not be any keyboard input capability for completing steps. It will all be done via voice chat.

Here's a list of sample groups and steps that would be displayed in the core component:

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
