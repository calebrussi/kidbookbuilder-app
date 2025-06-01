import { Conversation } from './components/conversation';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Character Creation Quiz
        </h1>
        <p className="text-center mb-8">
          This interactive quiz will help you create characters for your story
          through a natural conversation with an AI assistant.
        </p>
        <Conversation />
      </div>
    </main>
  );
}
