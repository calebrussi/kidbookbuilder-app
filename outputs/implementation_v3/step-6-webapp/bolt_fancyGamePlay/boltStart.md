I need to use Bolt.new to create a web UI for the chat interface. I need to define the look and feel. I need to define the core components. I need to define the states of each component.

**IMPORTANT** I don't want the app to have any wired up functionality, just have a clean, functioning UI with state management.

The purpose of the app is to allow a kid to chat with a voice AI to complete multiple steps. Each step has to be completed in sequential order. Some steps are grouped together. There should be some progress indicator for each step, for each group, and for the entire workflow they are working through.

The look and feel should be fun, cartoony, captivating for kids from 8 to 12. Bright colors like in Cocomelon.

The core component is a list of ordered steps to complete. Each step will have a short title. Clicking on a step should activate it. There can only be one active step at a time. They cannot activate new steps, but they can reactive previous steps. Each step should visually indicate the current state:

    * not_started is the initial state all steps are in.
    * in_progress is the active step being worked on.  There can only be one step in this state.
    * started is a step that has previously been worked on, but was not completed, and is not the active step.
    * complete is the final state for all steps.
    * error is a state to catch any technical errors that occur when the step is being worked on.

There should be some cute, kid-friendly animation that happens when a step is started, and when a step is completed.

The list of ordered steps should be rendered like a map, where the user is going on a quest from area to area. Each of the groups would be an area. Then each of the steps is a quest in that area. For example, `Tell Me Your Story Style` would be an area and `What stories do you love?` would be one of the quests in that area.

The current workflow of steps should have a name (like Character Creation Quiz).

A secondard component should be an always-present help icon that the user can click if they need help. This will activate a new voice chat to help the user with whatever problem they are experiencing.

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
