# ElevenLabs WebSocket Troubleshooting Guide

## Common Issues and Solutions

### WebSocket Closing After Few Seconds

**Symptoms:**

- Connection starts successfully
- WebSocket closes automatically after 2-5 seconds
- Console shows "WebSocket is already in CLOSING or CLOSED state"

**Possible Causes & Solutions:**

#### 1. API Key Issues

- **Problem:** Invalid or missing ElevenLabs API key
- **Solution:**
  1. Get a valid API key from https://elevenlabs.io/app/settings/api-keys
  2. Add it to your `.env` file: `VITE_ELEVENLABS_API_KEY=your_actual_api_key`
  3. Restart the development server

#### 2. Agent ID Issues

- **Problem:** Invalid or non-existent agent ID
- **Solution:**
  1. Verify the agent exists in your ElevenLabs account
  2. Check the agent ID in your workflow configuration
  3. Ensure the agent is published and available

#### 3. Microphone Permission Issues

- **Problem:** Browser denies microphone access or audio stream fails
- **Solution:**
  1. Check browser microphone permissions
  2. Ensure HTTPS is used in production (required for microphone access)
  3. Test on localhost:8080 (should work for development)

#### 4. Network/Firewall Issues

- **Problem:** Corporate firewalls or network restrictions
- **Solution:**
  1. Check if WebSocket connections are allowed
  2. Test on different networks
  3. Verify ElevenLabs endpoints are accessible

#### 5. Audio Worklet Issues

- **Problem:** Browser audio worklet fails to initialize
- **Solution:**
  1. Try different browsers (Chrome/Edge recommended)
  2. Clear browser cache and reload
  3. Check for browser extensions blocking audio

## Debugging Steps

### 1. Check Browser Console

Look for these specific error patterns:

```
WebSocket is already in CLOSING or CLOSED state
Failed to start conversation
ElevenLabs Error: [specific error]
```

### 2. Test API Key

```javascript
// Open browser console and test:
console.log("API Key:", import.meta.env.VITE_ELEVENLABS_API_KEY);
```

### 3. Test Microphone Access

```javascript
// Test microphone permissions:
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => console.log("Microphone OK:", stream))
  .catch((err) => console.error("Microphone Error:", err));
```

### 4. Monitor Network Tab

- Open DevTools > Network tab
- Filter by "WS" (WebSocket connections)
- Look for connection status and error codes

## Improved Error Handling

The ChatInterface component now includes:

✅ **Connection Status Display** - Shows connecting/connected/error states
✅ **Automatic Retry Logic** - Retries up to 3 times on disconnect
✅ **Manual Retry Button** - Allows manual retry after failures
✅ **Enhanced Error Messages** - More detailed error information
✅ **API Key Validation** - Checks for missing/invalid API keys
✅ **Microphone Stream Configuration** - Better audio constraints

## Best Practices

1. **Always test with a valid API key and agent ID**
2. **Use HTTPS in production for microphone access**
3. **Handle network interruptions gracefully**
4. **Provide clear user feedback for all error states**
5. **Test across different browsers and devices**

## Contact & Support

If issues persist:

1. Check ElevenLabs documentation: https://elevenlabs.io/docs
2. Verify your account status and agent configuration
3. Test with ElevenLabs' official examples first
