import { NextResponse } from 'next/server';

export async function GET() {
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

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.NEXT_PUBLIC_AGENT_ID}`,
            {
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY!,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            return NextResponse.json(
                {
                    error: 'Failed to get signed URL',
                    status: response.status,
                    details: errorData
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ signedUrl: data.signed_url });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: 'Failed to generate signed URL',
                message: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
} 