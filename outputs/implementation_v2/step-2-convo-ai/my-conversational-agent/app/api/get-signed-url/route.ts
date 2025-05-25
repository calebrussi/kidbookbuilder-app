import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Check if environment variables are set
        if (!process.env.ELEVENLABS_API_KEY) {
            return NextResponse.json(
                {
                    error: 'API key not configured',
                    message: 'Please set ELEVENLABS_API_KEY in your .env.local file'
                },
                { status: 500 }
            );
        }

        if (!process.env.NEXT_PUBLIC_AGENT_ID) {
            return NextResponse.json(
                {
                    error: 'Agent ID not configured',
                    message: 'Please set NEXT_PUBLIC_AGENT_ID in your .env.local file'
                },
                { status: 500 }
            );
        }

        // Make the actual request to ElevenLabs API
        try {
            console.log('Requesting signed URL from ElevenLabs...');
            console.log('Using agent ID:', process.env.NEXT_PUBLIC_AGENT_ID);

            // Using the conversation API instead of the agent-specific endpoint
            const response = await fetch(
                `https://api.elevenlabs.io/v1/conversations/get-websocket-url`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        agent_id: process.env.NEXT_PUBLIC_AGENT_ID
                    })
                }
            );

            if (!response.ok) {
                console.error('ElevenLabs API error:', response.status);
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('Error details:', JSON.stringify(errorData));
                return NextResponse.json(
                    {
                        error: 'Failed to get signed URL from ElevenLabs',
                        status: response.status,
                        details: errorData
                    },
                    { status: response.status }
                );
            }

            const data = await response.json();
            console.log('Signed URL received successfully');
            return NextResponse.json({ signedUrl: data.websocket_url || data.signed_url });
        } catch (error: any) {
            console.error('Error fetching from ElevenLabs:', error);
            return NextResponse.json(
                {
                    error: 'Failed to connect to ElevenLabs API',
                    message: error.message || 'Unknown error'
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('General API route error:', error);
        return NextResponse.json(
            {
                error: 'API route error',
                message: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
} 