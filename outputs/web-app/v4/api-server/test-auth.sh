#!/bin/bash

# Test script for authentication flow
echo "🧪 Testing Authentication Flow"
echo "================================"

API_URL="http://localhost:3001/api/workflow"

echo ""
echo "1. Testing with missing credentials..."
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'

echo ""
echo "2. Testing with wrong passcode..."
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "passcode": "wrong"}' | jq '.'

echo ""
echo "3. Testing with correct credentials..."
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "passcode": "demo123"}' | jq '.title, .sections[0].title'

echo ""
echo "✅ Authentication tests completed!"
