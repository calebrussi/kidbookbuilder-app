import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

type QuestionSection = 'story_style' | 'world_design' | 'characters' | 'adventure';

interface SectionAnswers {
    [key: string]: string;
}

interface CharacterAttributes {
    story_style?: SectionAnswers;
    world_design?: SectionAnswers;
    characters?: SectionAnswers;
    adventure?: SectionAnswers;
    voiceId?: string;
}

// Replace mapped type with simple Record type
type FeedbackMessages = Record<QuestionSection, string>;

export class CharacterCreationQuiz extends EventEmitter {
    private character: CharacterAttributes = {};
    private ws: WebSocket | null = null;
    private currentQuestion: number = 0;
    private currentSection: 'story_style' | 'world_design' | 'characters' | 'adventure' = 'story_style';
    private readonly sections: Array<'story_style' | 'world_design' | 'characters' | 'adventure'> = ['story_style', 'world_design', 'characters', 'adventure'];
    private readonly questions: Record<'story_style' | 'world_design' | 'characters' | 'adventure', string[]> = {
        story_style: [
            "What kind of stories do you love the most? For example: magical, funny, exciting adventures...",
            "How long would you like your story to be? A short tale or a longer adventure?"
        ],
        world_design: [
            "Should your story happen in a magical world or the real world?",
            "Where should your story take place? A castle, outer space, under the sea...",
            "When does your story happen? In the past, present, or future?",
            "Tell me about the weather and places in your story world."
        ],
        characters: [
            "What's your hero's name?",
            "What makes your hero special? Are they brave, clever, funny...?",
            "Does your hero have any magical powers or special abilities?",
            "Who are your hero's friends and family?",
            "What challenges or fears does your hero need to overcome?"
        ],
        adventure: [
            "What kind of quest or mission will your hero go on?",
            "What friendships or feelings will be important in your story?",
            "What challenges will your hero face?",
            "How do you want your story to end?"
        ]
    };

    constructor() {
        super();
        console.log('🎭 Initializing character creation quiz...');
        this.setupVoiceConnection();
    }

    private setupVoiceConnection() {
        console.log('🎙️ Setting up voice connection...');
        const apiKey = process.env.ELEVEN_LABS_API_KEY;
        console.log('🔑 API Key available:', !!apiKey);
        const voiceId = 'Xb7hH8MSUJpSbSDYk0k2'; // Default voice ID
        const modelId = 'eleven_flash_v2_5';
        
        const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?model_id=${modelId}`;
        
        this.ws = new WebSocket(uri, {
            headers: {
                'xi-api-key': apiKey || ''
            }
        });

        this.ws.on('open', () => {
            console.log('🎙️ Voice connection established');
            this.startQuiz();
        });

        this.ws.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.audio) {
                    this.emit('audio', Buffer.from(message.audio, 'base64'));
                }
            } catch (error) {
                console.error('Error processing audio message:', error);
            }
        });

        this.ws.on('error', (error: Error) => {
            console.error('Voice connection error:', error);
        });

        this.ws.on('close', () => {
            console.log('Voice connection closed');
        });
    }

    private async speak(text: string): Promise<void> {
        if (!this.ws) return;

        const message = {
            text,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8
            }
        };

        this.ws.send(JSON.stringify(message));
        
        // Send empty message to indicate end of stream
        setTimeout(() => {
            if (this.ws) {
                this.ws.send(JSON.stringify({ text: '' }));
            }
        }, 100);
    }

    public async startQuiz(): Promise<void> {
        await this.speak("Hi! I'm your friendly character creation assistant. Let's create an amazing character together!");
        await this.askNextQuestion();
    }

    private getCurrentSectionQuestions(): string[] {
        return this.questions[this.currentSection];
    }

    private async moveToNextSection(): Promise<void> {
        const currentSectionIndex = this.sections.indexOf(this.currentSection);
        if (currentSectionIndex < this.sections.length - 1) {
            this.currentSection = this.sections[currentSectionIndex + 1];
            this.currentQuestion = 0;
            await this.speak(`Now let's talk about ${this.currentSection.replace('_', ' ')}!`);
        } else {
            await this.finishQuiz();
        }
    }

    private async askNextQuestion(): Promise<void> {
        const currentQuestions = this.getCurrentSectionQuestions();
        
        if (this.currentQuestion >= currentQuestions.length) {
            await this.moveToNextSection();
            return;
        }

        const question = currentQuestions[this.currentQuestion];
        await this.speak(question);
        this.emit('question', question);
    }

    public async handleAnswer(answer: string): Promise<void> {
        // Store the answer based on the current section and question
        if (!this.character[this.currentSection]) {
            this.character[this.currentSection] = {};
        }

        const currentQuestions = this.getCurrentSectionQuestions();
        const questionKey = currentQuestions[this.currentQuestion]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_');
        
        if (!this.character[this.currentSection]) {
            this.character[this.currentSection] = {};
        }
        this.character[this.currentSection]![questionKey] = answer;

        // Provide encouraging feedback based on the section
        const feedbackMessages = {
            story_style: "That's a wonderful choice for your story!",
            world_design: "Your story world is becoming more magical with every detail!",
            characters: "Your character is coming to life beautifully!",
            adventure: "This adventure is going to be amazing!"
        };

        await this.speak(feedbackMessages[this.currentSection]);
        this.currentQuestion++;
        await this.askNextQuestion();
    }

    private async finishQuiz(): Promise<void> {
        const summary = `Amazing! We've created a wonderful story world! 
            Your story will be ${this.character.story_style?.story_length} and filled with ${this.character.story_style?.favorite_stories} elements.
            It takes place in ${this.character.world_design?.setting}, ${this.character.world_design?.world_type === 'magical' ? 'a magical realm' : 'the real world'}.
            Our hero ${this.character.characters?.name} is ${this.character.characters?.personality} and has the incredible power of ${this.character.characters?.powers}.
            They'll go on a ${this.character.adventure?.quest_type} quest, facing ${this.character.adventure?.challenges} along the way.
            ${this.character.adventure?.ending ? `And in the end, ${this.character.adventure.ending}` : ''}`;

        await this.speak(summary);
        this.emit('complete', this.character);
        
        // Save the character data
        const outputDir = path.join(__dirname, 'characters');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const characterFile = path.join(outputDir, `${this.character.characters?.name?.toLowerCase().replace(/\s+/g, '_')}.json`);
        fs.writeFileSync(characterFile, JSON.stringify(this.character, null, 2));

        if (this.ws) {
            this.ws.close();
        }
    }
}
