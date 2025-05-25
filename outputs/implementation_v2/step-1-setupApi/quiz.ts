import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Define our types
type QuestionSection = 'story_style' | 'world_design' | 'characters' | 'adventure';

interface SectionData {
    [key: string]: string;
}

interface CharacterAttributes {
    story_style: SectionData;
    world_design: SectionData;
    characters: SectionData;
    adventure: SectionData;
}

export class CharacterCreationQuiz extends EventEmitter {
    private character: CharacterAttributes = {
        story_style: {},
        world_design: {},
        characters: {},
        adventure: {}
    };
    
    private ws: WebSocket | null = null;
    private currentQuestion = 0;
    private currentSection: QuestionSection = 'story_style';
    
    private readonly sections: QuestionSection[] = [
        'story_style',
        'world_design',
        'characters',
        'adventure'
    ];
    
    private readonly questions: Record<QuestionSection, string[]> = {
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

    private readonly feedbacks: Record<QuestionSection, string> = {
        story_style: "That's a wonderful choice for your story!",
        world_design: "Your story world is becoming more magical with every detail!",
        characters: "Your character is coming to life beautifully!",
        adventure: "This adventure is going to be amazing!"
    };

    constructor() {
        super();
        console.log('🎭 Initializing character creation quiz...');
        this.setupVoiceConnection();
    }

    private setupVoiceConnection(): void {
        console.log('🎙️ Setting up voice connection...');
        const apiKey = process.env.ELEVEN_LABS_API_KEY;
        console.log('🔑 API Key available:', !!apiKey);
        
        const voiceId = 'Xb7hH8MSUJpSbSDYk0k2';
        const modelId = 'eleven_flash_v2_5';
        const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?model_id=${modelId}`;
        
        this.ws = new WebSocket(uri, {
            headers: { 'xi-api-key': apiKey || '' }
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
        console.log('🗣️ Speaking:', text);

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
        await this.speak("Hi! I'm your friendly story creation assistant. Let's build an amazing story together!");
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
            await this.askNextQuestion();
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
        console.log(`📝 Recording answer for ${this.currentSection}, question ${this.currentQuestion}`);
        
        const currentQuestions = this.getCurrentSectionQuestions();
        const questionKey = currentQuestions[this.currentQuestion]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_');
        
        this.character[this.currentSection][questionKey] = answer;

        await this.speak(this.feedbacks[this.currentSection]);
        this.currentQuestion++;
        await this.askNextQuestion();
    }

    private async finishQuiz(): Promise<void> {
        console.log('✨ Finishing quiz and generating summary...');
        
        const { story_style, world_design, characters, adventure } = this.character;
        
        const summary = `Amazing! We've created a wonderful story world! 
            Your story will be ${story_style.how_long_would_you_like_your_story_to_be || 'an exciting'} story filled with ${story_style.what_kind_of_stories_do_you_love_the_most || 'magical'} elements.
            It takes place in ${world_design.where_should_your_story_take_place || 'an amazing world'}, ${world_design.should_your_story_happen_in_a_magical_world_or_the_real_world === 'magical' ? 'a magical realm' : 'the real world'}.
            Our hero ${characters.what_s_your_hero_s_name || 'our hero'} is ${characters.what_makes_your_hero_special || 'special'} and has ${characters.does_your_hero_have_any_magical_powers_or_special_abilities || 'amazing abilities'}.
            They'll go on a ${adventure.what_kind_of_quest_or_mission_will_your_hero_go_on || 'grand'} quest, facing ${adventure.what_challenges_will_your_hero_face || 'exciting challenges'} along the way.
            ${adventure.how_do_you_want_your_story_to_end ? `And in the end, ${adventure.how_do_you_want_your_story_to_end}` : ''}`;

        await this.speak(summary);
        this.emit('complete', this.character);
        
        // Save the character data
        const outputDir = path.join(__dirname, 'characters');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const characterName = characters.what_s_your_hero_s_name?.toLowerCase().replace(/\s+/g, '_') || 'unnamed_hero';
        const characterFile = path.join(outputDir, `${characterName}.json`);
        
        fs.writeFileSync(characterFile, JSON.stringify(this.character, null, 2));
        console.log('💾 Saved character data to:', characterFile);

        if (this.ws) {
            this.ws.close();
        }
    }
}
