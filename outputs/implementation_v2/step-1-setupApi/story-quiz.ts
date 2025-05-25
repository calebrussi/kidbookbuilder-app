import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

interface StoryPreferences {
    genre?: string;
    length?: string;
    favoriteThemes?: string[];
}

interface WorldSettings {
    type: 'magical' | 'real';
    setting: string;
    timeframe: string;
    environment: string;
}

interface Character {
    name: string;   
    personality: string[];
    powers?: string[];
    relationships: string[];
    challenges: string[];
}

interface Adventure {
    questType: string;
    emotionalElements: string[];
    challenges: string[];
    desiredEnding: string;
}

interface StoryGuide {
    preferences: StoryPreferences;
    world: WorldSettings;
    mainCharacter: Character;
    adventure: Adventure;
}

export class StoryCreationQuiz extends EventEmitter {
    private ws: WebSocket | null = null;
    private currentSection: 'preferences' | 'world' | 'character' | 'adventure' = 'preferences';
    private currentQuestionIndex = 0;
    private storyGuide: Partial<StoryGuide> = {
        preferences: {},
        world: {} as WorldSettings,
        mainCharacter: {} as Character,
        adventure: {} as Adventure
    };

    private readonly questions = {
        preferences: [
            "What kind of stories do you love the most? For example: magical, funny, exciting adventures...",
            "How long would you like your story to be? A short tale or a longer adventure?"
        ],
        world: [
            "Should your story happen in a magical world or the real world?",
            "Where should your story take place? A castle, outer space, under the sea...",
            "When does your story happen? In the past, present, or future?",
            "Tell me about the weather and special places in your story world."
        ],
        character: [
            "What's your hero's name?",
            "What makes your hero special? Tell me about their personality.",
            "Does your hero have any magical powers or special abilities?",
            "Who are your hero's friends and family?",
            "What fears or challenges does your hero need to overcome?"
        ],
        adventure: [
            "What kind of quest or mission will your hero go on?",
            "What feelings and friendships will be important in your story?",
            "What exciting challenges will your hero face?",
            "How do you want your story to end?"
        ]
    };

    private readonly feedback = {
        preferences: [
            "That sounds like it will make an amazing story!",
            "Perfect! We'll make it just the right length for you."
        ],
        world: [
            "How exciting! Let's explore this world together.",
            "I can picture it now! What a fantastic setting.",
            "That's a perfect time for your story!",
            "Your story world sounds magical!"
        ],
        character: [
            "That's a wonderful name!",
            "Your hero sounds amazing!",
            "Those are some cool abilities!",
            "They sound like great companions for your hero!",
            "Your hero will grow so much overcoming these challenges!"
        ],
        adventure: [
            "That's going to be an exciting quest!",
            "Those feelings will make your story very meaningful.",
            "Those challenges will keep readers on the edge of their seats!",
            "What a perfect ending for your story!"
        ]
    };

    constructor() {
        super();
        this.setupVoiceConnection();
    }

    private setupVoiceConnection() {
        const apiKey = process.env.ELEVEN_LABS_API_KEY;
        if (!apiKey) {
            throw new Error('Missing ElevenLabs API key in environment variables');
        }

        const voiceId = 'Xb7hH8MSUJpSbSDYk0k2'; // Friendly, child-appropriate voice
        const modelId = 'eleven_flash_v2_5';
        const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?model_id=${modelId}`;

        this.ws = new WebSocket(uri, {
            headers: { 'xi-api-key': apiKey }
        });

        this.ws.on('open', () => {
            console.log('🎙️ Voice connection ready');
            this.start();
        });

        this.ws.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.audio) {
                    this.emit('audio', Buffer.from(message.audio, 'base64'));
                }
            } catch (error) {
                console.error('Error processing audio:', error);
            }
        });

        this.ws.on('error', console.error);
        this.ws.on('close', () => console.log('Voice connection closed'));
    }

    private async speak(text: string): Promise<void> {
        if (!this.ws) return;
        console.log('🗣️ Speaking:', text);

        const message = {
            text,
            voice_settings: {
                stability: 0.71,
                similarity_boost: 0.85
            }
        };

        this.ws.send(JSON.stringify(message));
        await new Promise(resolve => setTimeout(resolve, 100));
        this.ws.send(JSON.stringify({ text: '' }));
    }

    public async start(): Promise<void> {
        await this.speak(
            "Hi! I'm your friendly story guide! Let's create an amazing story together. " +
            "I'll ask you some questions to help bring your story to life!"
        );
        await this.askNextQuestion();
    }

    private async askNextQuestion(): Promise<void> {
        const questions = this.questions[this.currentSection];
        
        if (this.currentQuestionIndex >= questions.length) {
            await this.moveToNextSection();
            return;
        }

        const question = questions[this.currentQuestionIndex];
        await this.speak(question);
        this.emit('question', question);
    }

    private async moveToNextSection(): Promise<void> {
        const sections: Array<'preferences' | 'world' | 'character' | 'adventure'> = 
            ['preferences', 'world', 'character', 'adventure'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        if (currentIndex < sections.length - 1) {
            this.currentSection = sections[currentIndex + 1];
            this.currentQuestionIndex = 0;
            await this.speak(`Now let's talk about ${this.currentSection === 'character' ? 'your hero' : 'your ' + this.currentSection}!`);
            await this.askNextQuestion();
        } else {
            await this.finish();
        }
    }

    public async handleAnswer(answer: string): Promise<void> {
        // Store the answer in the appropriate section
        this.storeAnswer(answer);
        
        // Give encouraging feedback
        const feedback = this.feedback[this.currentSection][this.currentQuestionIndex];
        await this.speak(feedback);
        
        this.currentQuestionIndex++;
        await this.askNextQuestion();
    }

    private storeAnswer(answer: string): void {
        switch (this.currentSection) {
            case 'preferences':
                if (this.currentQuestionIndex === 0) {
                    this.storyGuide.preferences!.genre = answer;
                } else {
                    this.storyGuide.preferences!.length = answer;
                }
                break;
            
            case 'world':
                const world = this.storyGuide.world!;
                if (this.currentQuestionIndex === 0) {
                    world.type = answer.toLowerCase().includes('magic') ? 'magical' : 'real';
                } else if (this.currentQuestionIndex === 1) {
                    world.setting = answer;
                } else if (this.currentQuestionIndex === 2) {
                    world.timeframe = answer;
                } else {
                    world.environment = answer;
                }
                break;
            
            case 'character':
                const character = this.storyGuide.mainCharacter!;
                if (this.currentQuestionIndex === 0) {
                    character.name = answer;
                } else if (this.currentQuestionIndex === 1) {
                    character.personality = answer.split(/,\s*/);
                } else if (this.currentQuestionIndex === 2) {
                    character.powers = answer.split(/,\s*/);
                } else if (this.currentQuestionIndex === 3) {
                    character.relationships = answer.split(/,\s*/);
                } else {
                    character.challenges = answer.split(/,\s*/);
                }
                break;
            
            case 'adventure':
                const adventure = this.storyGuide.adventure!;
                if (this.currentQuestionIndex === 0) {
                    adventure.questType = answer;
                } else if (this.currentQuestionIndex === 1) {
                    adventure.emotionalElements = answer.split(/,\s*/);
                } else if (this.currentQuestionIndex === 2) {
                    adventure.challenges = answer.split(/,\s*/);
                } else {
                    adventure.desiredEnding = answer;
                }
                break;
        }
    }

    private async finish(): Promise<void> {
        const { mainCharacter, world, adventure } = this.storyGuide;
        
        const summary = `
            Amazing! We've created something special! Let me tell you about your story:
            
            Our hero ${mainCharacter!.name} is ${mainCharacter!.personality.join(' and ')}. 
            ${mainCharacter!.powers ? `They have incredible powers: ${mainCharacter!.powers.join(', ')}!` : ''}
            
            Their story takes place in a ${world!.type} world, specifically in ${world!.setting}, 
            during ${world!.timeframe}. ${world!.environment}
            
            ${mainCharacter!.name} will go on a ${adventure!.questType} quest, facing ${adventure!.challenges.join(' and ')}. 
            Along the way, they'll experience ${adventure!.emotionalElements.join(' and ')}.
            
            And in the end, ${adventure!.desiredEnding}!
            
            This is going to be an incredible story!
        `.replace(/\s+/g, ' ').trim();

        await this.speak(summary);
        
        // Save the story guide
        const outputDir = path.join(__dirname, 'stories');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const filename = path.join(outputDir, `${mainCharacter!.name.toLowerCase().replace(/\s+/g, '_')}_story_guide.json`);
        fs.writeFileSync(filename, JSON.stringify(this.storyGuide, null, 2));
        
        this.emit('complete', this.storyGuide);
        
        if (this.ws) {
            this.ws.close();
        }
    }
}
