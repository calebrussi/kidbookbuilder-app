import { StoryCreationQuiz } from './story-quiz.js';
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import * as fs from 'fs';
import * as path from 'path';

// Create a custom mock type for WebSocket
type MockWebSocket = {
  on: jest.Mock;
  send: jest.Mock;
  close: jest.Mock;
} & WebSocket;

// Mock WebSocket
jest.mock('ws', () => {
  return {
    WebSocket: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    }))
  };
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('StoryCreationQuiz', () => {
  let quiz: StoryCreationQuiz;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup environment variable
    process.env.ELEVEN_LABS_API_KEY = 'test-api-key';
    
    // Create a new quiz instance
    quiz = new StoryCreationQuiz();
    
    // Get the mock WebSocket instance
    mockWs = (WebSocket as unknown as jest.Mock<typeof WebSocket>).mock.instances[0] as MockWebSocket;
  });

  afterEach(() => {
    delete process.env.ELEVEN_LABS_API_KEY;
  });

  describe('Initialization', () => {
    it('should extend EventEmitter', () => {
      expect(quiz).toBeInstanceOf(EventEmitter);
    });

    it('should initialize with correct default values', () => {
      expect(quiz['currentSection']).toBe('preferences');
      expect(quiz['currentQuestionIndex']).toBe(0);
      expect(quiz['storyGuide']).toEqual({
        preferences: {},
        world: {},
        mainCharacter: {},
        adventure: {}
      });
    });

    it('should setup WebSocket connection with correct parameters', () => {
      expect(WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('wss://api.elevenlabs.io'),
        expect.objectContaining({
          headers: { 'xi-api-key': 'test-api-key' }
        })
      );
    });
  });

  describe('Question Flow', () => {
    it('should have correct number of questions for each section', () => {
      expect(quiz['questions'].preferences).toHaveLength(2);
      expect(quiz['questions'].world).toHaveLength(4);
      expect(quiz['questions'].character).toHaveLength(5);
      expect(quiz['questions'].adventure).toHaveLength(4);
    });

    it('should provide feedback for each question', () => {
      expect(quiz['feedback'].preferences).toHaveLength(2);
      expect(quiz['feedback'].world).toHaveLength(4);
      expect(quiz['feedback'].character).toHaveLength(5);
      expect(quiz['feedback'].adventure).toHaveLength(4);
    });
  });

  describe('Answer Handling', () => {
    it('should store answers correctly in preferences section', async () => {
      await quiz.handleAnswer('fantasy');
      expect(quiz['storyGuide'].preferences?.genre).toBe('fantasy');
      
      await quiz.handleAnswer('long');
      expect(quiz['storyGuide'].preferences?.length).toBe('long');
    });

    it('should store answers correctly in world section', async () => {
      quiz['currentSection'] = 'world';
      
      await quiz.handleAnswer('magical');
      expect(quiz['storyGuide'].world?.type).toBe('magical');
      
      await quiz.handleAnswer('castle');
      expect(quiz['storyGuide'].world?.setting).toBe('castle');
    });

    it('should handle character answers with array splitting', async () => {
      quiz['currentSection'] = 'character';
      
      await quiz.handleAnswer('Hero Name');
      expect(quiz['storyGuide'].mainCharacter?.name).toBe('Hero Name');
      
      await quiz.handleAnswer('brave, smart');
      expect(quiz['storyGuide'].mainCharacter?.personality).toEqual(['brave', 'smart']);
    });
  });

  describe('Voice Interaction', () => {
    it('should send message with correct format', async () => {
      await quiz['speak']('test message');
      
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('test message')
      );
    });

    it('should handle audio data correctly', () => {
      const mockAudioData = Buffer.from('test');
      const mockCallback = jest.fn();
      
      quiz.on('audio', mockCallback);
      
      // Simulate receiving audio data
      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler(JSON.stringify({ audio: mockAudioData.toString('base64') }));
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Quiz Completion', () => {
    beforeEach(() => {
      // Mock directory checks
      (fs.existsSync as jest.Mock).mockReturnValue(false);
    });

    it('should save story guide to file on completion', async () => {
      // Setup story guide with test data
      quiz['storyGuide'] = {
        preferences: { genre: 'fantasy', length: 'long' },
        world: { type: 'magical', setting: 'castle', timeframe: 'past', environment: 'mystical' },
        mainCharacter: { name: 'Hero', personality: ['brave'], relationships: [], challenges: [] },
        adventure: { questType: 'rescue', emotionalElements: [], challenges: [], desiredEnding: 'happy' }
      };

      await quiz['finish']();

      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('hero_story_guide.json'),
        expect.any(String)
      );
    });
  });
});
