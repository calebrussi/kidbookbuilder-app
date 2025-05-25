I need to create an Eleven Labs agent.  The specific fields I need are:

    * **First Message**: The first message the agent will say. If empty, the agent will wait for the user to start the conversation.

    * **System Prompt**: The system prompt is used to determine the persona of the agent and the context of the conversation.

    * **Goal prompt criteria**: Passes the conversation transcript together with a custom prompt to the LLM that verifies if a goal was met. The result will be one of three values: success, failure, or unknown, as well as a rationale describing why the given result was chosen.

The system prompt should include that we are talking to a 10 year old about creating a fun story.

The goal of the prompt is to gather:

    * What stories do you love? (favorite genres and themes)