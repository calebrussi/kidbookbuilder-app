import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Character Creation Quiz',
  description: 'Interactive character creation using ElevenLabs conversational AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
