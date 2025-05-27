import { Workflow } from '../types/workflow';

export const characterCreationQuizWorkflow: Workflow = {
  id: 'character-creation-quiz',
  title: 'Character Creation Quiz',
  sections: [
    {
      id: 'tell-me-your-story-style',
      title: 'Tell Me Your Story Style',
      steps: [
        {
          id: 'personality_selection_agent',
          title: 'What is your hero\'s personality?',
          sectionId: 'tell-me-your-story-style',
          agentId: 'agent_01jw1xz0rpeh0tp8yb2mmr1zm8'
        },
        {
          id: 'story-length',
          title: 'How long should your story be?',
          sectionId: 'tell-me-your-story-style',
          agentId: 'agent_01jw2119kbe02a4j34eahjsamf'
        }
      ]
    },
    {
      id: 'design-your-story-world',
      title: 'Design Your Story World',
      steps: [
        {
          id: 'world-type',
          title: 'Magic or Real World?',
          sectionId: 'design-your-story-world',
          agentId: 'agent_01jw211cfyejd9n20t3bp3ncg3'
        }
      ]
    }
  ]
};
