import { Conversation } from './components/conversation';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
                <h1 className="text-4xl font-bold mb-8">
                    ElevenLabs Conversational AI
                </h1>
                <p className="mb-8 text-lg">
                    Talk to an AI assistant using ElevenLabs voice technology
                </p>
                <div className="w-full flex justify-center">
                    <Conversation />
                </div>
            </div>
        </main>
    );
} 