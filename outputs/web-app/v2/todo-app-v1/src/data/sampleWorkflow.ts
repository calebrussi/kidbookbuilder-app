
import { Workflow } from '../types/workflow';

export const characterCreationWorkflow: Workflow = {
  id: 'character-creation',
  title: 'Character Creation Quiz',
  sections: [
    {
      id: 'story-style',
      title: 'Tell Me Your Story Style',
      steps: [
        {
          id: 'favorite-stories',
          title: 'What stories do you love?',
          state: 'in_progress',
          sectionId: 'story-style',
          agentId: 'agent_01jw7a67zjffp9xcm3c4ed1g5g'
        },
        {
          id: 'story-length',
          title: 'How long should your story be?',
          state: 'not_started',
          sectionId: 'story-style',
          agentId: 'agent_01jw7a8p00emfvdd22yyg0sv9f'
        }
      ]
    },
    {
      id: 'story-world',
      title: 'Design Your Story World',
      steps: [
        {
          id: 'magic-or-real',
          title: 'Magic or Real World?',
          state: 'not_started',
          sectionId: 'story-world',
          agentId: 'agent_01jw7a8rkgfvt9dk02j5vb004x'
        },
        {
          id: 'pick-setting',
          title: 'Pick Your Setting',
          state: 'not_started',
          sectionId: 'story-world',
          agentId: 'agent_01jw7a8v01exs85mjgb1ak3q34'
        },
        {
          id: 'time-period',
          title: 'When Does It Happen?',
          state: 'not_started',
          sectionId: 'story-world',
          agentId: 'agent_01jw7a8xtcefntjkedmdt8m3fk'
        },
        {
          id: 'environment',
          title: 'Weather & Places',
          state: 'not_started',
          sectionId: 'story-world',
          agentId: 'agent_01jw7a91gqf2wbksct5rrhnaca'
        }
      ]
    },
    {
      id: 'characters',
      title: 'Create Your Characters',
      steps: [
        {
          id: 'hero-personality',
          title: 'Your Hero\'s Personality',
          state: 'not_started',
          sectionId: 'characters',
          agentId: 'agent_01jw7a9xz0fg3ssp454zd4rh1y'
        },
        {
          id: 'friends-family',
          title: 'Friends & Family',
          state: 'not_started',
          sectionId: 'characters',
          agentId: 'agent_01jw7aa07ceyct7kk8xxr6y9sp'
        },
        {
          id: 'special-powers',
          title: 'Special Powers',
          state: 'not_started',
          sectionId: 'characters',
          agentId: 'agent_01jw7aa27ne5kacg1h304qr6nh'
        },
        {
          id: 'hero-challenges',
          title: 'Hero\'s Challenges',
          state: 'not_started',
          sectionId: 'characters',
          agentId: 'agent_01jw7aa4ete3vb5rhf98rcgfhn'
        }
      ]
    },
    {
      id: 'adventure',
      title: 'Choose Your Adventure',
      steps: [
        {
          id: 'quest-type',
          title: 'Type of Quest',
          state: 'not_started',
          sectionId: 'adventure',
          agentId: 'agent_01jw7aa6zwf3k8b8rsafv7qary'
        },
        {
          id: 'friendship-feelings',
          title: 'Friendship & Feelings',
          state: 'not_started',
          sectionId: 'adventure',
          agentId: 'agent_01jw7aaa0zevrtnc5cmayqrr2y'
        },
        {
          id: 'challenges-face',
          title: 'Challenges to Face',
          state: 'not_started',
          sectionId: 'adventure',
          agentId: 'agent_01jw7aad4afxrstpst288ydrcs'
        },
        {
          id: 'story-ending',
          title: 'How It Ends',
          state: 'not_started',
          sectionId: 'adventure',
          agentId: 'agent_01jw7aafqwf5qa2rbepxgnw4tx'
        }
      ]
    }
  ]
};
