#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

// Test conversation data
const testConversation = {
    id: "test-" + Date.now(),
    startTime: new Date().toISOString(),
    messages: [
        {
            id: "msg1",
            content: "Hello, this is a test message",
            timestamp: new Date().toISOString(),
            sender: "user"
        },
        {
            id: "msg2",
            content: "This is a test response",
            timestamp: new Date().toISOString(),
            sender: "agent"
        }
    ]
};

// Create a POST request to the API endpoint
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/save-conversation',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Testing conversation saving...');

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
        console.log('Now checking if file was created...');

        // Check if the file was created
        const CONVERSATIONS_DIR = path.join(process.cwd(), 'conversations');
        const files = fs.readdirSync(CONVERSATIONS_DIR);
        console.log('Files in conversations directory:', files);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

// Write the conversation data to the request body
req.write(JSON.stringify(testConversation));
req.end(); 