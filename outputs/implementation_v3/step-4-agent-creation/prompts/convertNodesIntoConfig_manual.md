# Converting Text Descriptions into Agent Configuration Files

## Purpose

This document provides instructions for converting simple text descriptions of conversation nodes (like questions about story preferences) into structured JSON configuration files for conversational agents in the KidBookBuilder application.

## Input Format

The input will be a list of text descriptions representing conversation nodes or questions that an agent might ask a child user. Each description should capture the essence of what information the agent needs to collect. Examples:

- What stories do you love? (favorite genres and themes)
- How long should your story be? (short stories, chapter books)
- Magic or Real World? (choose your world type)
- Pick Your Setting (kingdoms, space, underwater, etc.)
- When Does It Happen? (past, present, future)
- Weather & Places (environment details)

## Output Format

The output should be a JSON configuration file with the following structure:

```json
{
  "name": "[agent_name]_selection_agent",
  "agent": {
    "first_message": "[An engaging first message that introduces the topic and asks the main question]"
  },
  "prompt": {
    "prompt": "[Detailed instructions for the agent's personality, approach, and engagement style when talking to a child]",
    "tools": {
      "description": "[Instructions for when to end the conversation and how to confirm collected information]"
    }
  },
  "platform_settings": {
    "evaluation": {
      "criteria": [
        {
          "id": "[unique_identifier]",
          "name": "[descriptive_name]",
          "type": "prompt",
          "conversation_goal_prompt": "[Instructions for evaluating if the conversation successfully gathered the required information]"
        }
      ]
    },
    "data_collection": {
      "[data_field_name]": {
        "type": "string",
        "description": "[Description of what information to collect from the conversation]"
      }
    }
  }
}
```

## Conversion Process

1. **Identify the core topic** from the input description(s)

   - Extract the main subject (e.g., "personality", "setting", "genre")
   - This will become the prefix for the agent name (e.g., "setting_selection_agent")

2. **Create an engaging first message**

   - Begin with a welcoming phrase like "Let's create..." or "Let's pick..."
   - Incorporate the main question from the description
   - Add 2-3 examples to help guide the child
   - End with an open-ended question

3. **Develop the agent's prompt**

   - Start with "You are a friendly and encouraging storytelling companion talking to a 10-year-old child."
   - Define the agent's role based on the topic
   - Include instructions for presenting options to the child
   - Add guidance on using simple language and providing examples
   - Include instructions for being supportive and enthusiastic about the child's ideas
   - Add directions for exploring the child's suggestions further

4. **Define conversation ending criteria**

   - Specify what information needs to be collected
   - Include instructions for confirming the collected information with the child

5. **Set up evaluation criteria**

   - Create an evaluation ID and name based on the topic
   - Write a conversation goal prompt that specifies what successful information gathering looks like for this topic

6. **Configure data collection**
   - Name the data field based on the topic (e.g., "setting_preferences")
   - Write a description that clearly states what information should be collected

## Example Conversion

Input: "Pick Your Setting (kingdoms, space, underwater, etc.)"

Output:

```json
{
  "name": "setting_selection_agent",
  "agent": {
    "first_message": "Let's pick an amazing setting for your story! Would you like it to take place in a magical kingdom, outer space, under the ocean, or somewhere else entirely? What kind of world would make your story exciting?"
  },
  "prompt": {
    "prompt": "You are a friendly and encouraging storytelling companion talking to a 10-year-old child. Your role is to help them select an exciting setting for their story. Present various setting options (like kingdoms, outer space, underwater worlds, jungles, etc.) and help them understand what makes each setting special. Use simple but engaging language to describe how these settings might create different adventures. If they seem unsure, give examples (e.g., 'In a magical kingdom, your hero might meet wizards or dragons! In outer space, they could discover new planets!'). Be supportive and show enthusiasm for their ideas. If they suggest their own setting, help them explore it further by asking about specific details of this world.",
    "tools": {
      "description": "End the call when you have a clear understanding of their preferred story setting and some specific details about it. Once you have this information, confirm it with them and if they agree, end the chat."
    }
  },
  "platform_settings": {
    "evaluation": {
      "criteria": [
        {
          "id": "setting_choice",
          "name": "setting_choice",
          "type": "prompt",
          "conversation_goal_prompt": "Review the conversation transcript and determine if we have successfully gathered information about: the child's preferred story setting, specific details about this setting, and any particular elements of the setting they're excited about including"
        }
      ]
    },
    "data_collection": {
      "setting_preferences": {
        "type": "string",
        "description": "Collect information about: preferred story setting, specific details about this setting, and particular elements they're excited about including"
      }
    }
  }
}
```

## Notes

- Maintain a consistent tone across all agent configurations that is encouraging, friendly, and appropriate for a 10-year-old child
- Ensure examples are diverse and inclusive
- Keep language simple but not condescending
- Focus on positive reinforcement and creativity
