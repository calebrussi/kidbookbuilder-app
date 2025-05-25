import { CharacterCreationQuiz } from './quiz.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runQuiz() {
    console.log('🚀 Starting character creation quiz...');
    const quiz = new CharacterCreationQuiz();
    const outputDir = path.join(__dirname, 'output');
    
    console.log('📁 Setting up output directory...');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
        console.log('📁 Created output directory:', outputDir);
    }

    const audioFile = path.join(outputDir, 'story-creation.mp3');
    console.log('🎵 Audio will be saved to:', audioFile);
    const writeStream = fs.createWriteStream(audioFile);
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Handle the audio stream
    quiz.on('audio', (audioBuffer) => {
        writeStream.write(audioBuffer);
    });

    // Handle questions and user input
    quiz.on('question', (question) => {
        rl.question(`\n❓ ${question}\n👉 Your answer: `, async (answer) => {
            await quiz.handleAnswer(answer);
        });
    });

    // Handle quiz completion
    quiz.on('complete', (character) => {
        console.log('\n✨ Character Creation Complete! ✨');
        console.log('📝 Character Details:');
        console.log(JSON.stringify(character, null, 2));
        writeStream.end();
        rl.close();
    });

    console.log('⏳ Waiting for voice connection to establish...');
}

// Start the quiz
runQuiz().catch(error => {
    console.error('❌ Error running character creation quiz:', error);
    process.exit(1);
});
