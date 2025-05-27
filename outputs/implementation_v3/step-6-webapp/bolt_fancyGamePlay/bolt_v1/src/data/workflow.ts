import { Workflow } from '../types';

export const workflowData: Workflow = {
  "workflowName": "Character Creation Quiz",
  "groups": [
    {
      "id": "story-style",
      "name": "Tell Me Your Story Style",
      "theme": "magical-books",
      "description": "Welcome to the Story Style area! Here we'll discover what kind of stories you love to read and create. I'll help you pick the perfect style for your adventure!",
      "steps": [
        {
          "id": "favorite-stories",
          "title": "What stories do you love?",
          "description": "favorite genres and themes",
          "state": "complete"
        },
        {
          "id": "story-length",
          "title": "How long should your story be?",
          "description": "short stories, chapter books",
          "state": "in_progress"
        }
      ]
    },
    {
      "id": "story-world",
      "name": "Design Your Story World",
      "theme": "fantasy-castle",
      "description": "Amazing! Now we're in the World Building area! This is where we create the magical place where your story will happen. I'll guide you through choosing your perfect world!",
      "steps": [
        {
          "id": "world-type",
          "title": "Magic or Real World?",
          "description": "choose your world type",
          "state": "not_started"
        },
        {
          "id": "setting",
          "title": "Pick Your Setting",
          "description": "kingdoms, space, underwater, etc.",
          "state": "not_started"
        },
        {
          "id": "time-period",
          "title": "When Does It Happen?",
          "description": "past, present, future",
          "state": "not_started"
        },
        {
          "id": "environment",
          "title": "Weather & Places",
          "description": "environment details",
          "state": "not_started"
        }
      ]
    },
    {
      "id": "characters",
      "name": "Create Your Characters",
      "theme": "character-creator",
      "description": "Welcome to the Character Creator area! This is my favorite part - we get to design the heroes and friends in your story! Let's bring your characters to life together!",
      "steps": [
        {
          "id": "hero-personality",
          "title": "Your Hero's Personality",
          "description": "traits and qualities",
          "state": "not_started"
        },
        {
          "id": "friends-family",
          "title": "Friends & Family",
          "description": "supporting characters",
          "state": "not_started"
        },
        {
          "id": "special-powers",
          "title": "Special Powers",
          "description": "abilities and skills",
          "state": "not_started"
        },
        {
          "id": "challenges",
          "title": "Hero's Challenges",
          "description": "fears and obstacles",
          "state": "not_started"
        }
      ]
    },
    {
      "id": "adventure",
      "name": "Choose Your Adventure",
      "theme": "treasure-map",
      "description": "Wow! We've reached the final area - Adventure Planning! Here's where we decide what exciting things will happen in your story. This is going to be epic!",
      "steps": [
        {
          "id": "quest-type",
          "title": "Type of Quest",
          "description": "mystery, discovery, journey",
          "state": "not_started"
        },
        {
          "id": "emotions",
          "title": "Friendship & Feelings",
          "description": "emotional elements",
          "state": "not_started"
        },
        {
          "id": "obstacles",
          "title": "Challenges to Face",
          "description": "puzzles, battles, problems",
          "state": "not_started"
        },
        {
          "id": "ending",
          "title": "How It Ends",
          "description": "story outcome",
          "state": "not_started"
        }
      ]
    }
  ]
};