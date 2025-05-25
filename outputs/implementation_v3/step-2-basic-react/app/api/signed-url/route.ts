'use server';

/**
 * This file demonstrates how to create a signed URL for authentication with ElevenLabs agents
 * as mentioned in the documentation's optional authentication section.
 * 
 * This should be used as an API endpoint to generate secure, time-limited access to your agent.
 */

import { SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

// This should be a 32+ character secret key stored securely
const SECRET_KEY = process.env.ELEVENLABS_JWT_SECRET;

export async function GET(req: NextRequest) {
  try {
    if (!SECRET_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the agent ID from query parameter or environment
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || process.env.ELEVENLABS_AGENT_ID;
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Create the JWT
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(SECRET_KEY);
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 60 * 5; // 5 minutes
    
    const jwt = await new SignJWT({
      agentId: agentId,
      iat: now,
      exp: now + expiresIn
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secretKey);

    // Return the signed JWT
    return NextResponse.json({ signedUrl: `elevenlabs://agent/${agentId}/connection?jwt=${jwt}` });
    
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
