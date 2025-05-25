import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Ensure the conversations directory exists
const CONVERSATIONS_DIR = path.join(process.cwd(), 'conversations');
if (!fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
    try {
        // Parse the conversation data from the request body
        const conversationData = await req.json();

        if (!conversationData || !conversationData.id) {
            return NextResponse.json({ error: 'Invalid conversation data' }, { status: 400 });
        }

        // Create a filename based on the conversation ID
        const filename = `conversation-${conversationData.id}.json`;
        const filePath = path.join(CONVERSATIONS_DIR, filename);

        // Write the conversation data to a JSON file
        fs.writeFileSync(filePath, JSON.stringify(conversationData, null, 2));

        return NextResponse.json({ success: true, filePath });
    } catch (error) {
        console.error('Error saving conversation:', error);
        return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Read the list of conversation files
        const files = fs.readdirSync(CONVERSATIONS_DIR);
        const conversationFiles = files.filter(file => file.startsWith('conversation-') && file.endsWith('.json'));

        // Get the conversation ID from the URL query params
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            // If an ID is provided, return that specific conversation
            const filename = `conversation-${id}.json`;
            const filePath = path.join(CONVERSATIONS_DIR, filename);

            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }

            const conversationData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return NextResponse.json(conversationData);
        } else {
            // If no ID is provided, return a list of all conversations
            const conversations = conversationFiles.map(file => {
                const filePath = path.join(CONVERSATIONS_DIR, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                return {
                    id: data.id,
                    startTime: data.startTime,
                    messageCount: data.messages.length
                };
            });

            return NextResponse.json({ conversations });
        }
    } catch (error) {
        console.error('Error getting conversations:', error);
        return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
    }
} 