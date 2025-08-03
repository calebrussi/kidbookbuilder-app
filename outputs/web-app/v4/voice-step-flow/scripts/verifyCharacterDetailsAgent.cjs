#!/usr/bin/env node

/**
 * Script to verify the character-details agent configuration
 * This checks that the agent has the correct data collection fields
 */

require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY;
const AGENT_ID = 'agent_01jz94kta6encvtk7rabyatkkb'; // character-details agent

if (!ELEVENLABS_API_KEY) {
  console.error('❌ VITE_ELEVENLABS_API_KEY environment variable is required');
  process.exit(1);
}

async function verifyCharacterDetailsAgent() {
  console.log('🔍 Verifying character-details agent configuration...');
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const agentData = await response.json();
    
    console.log('✅ Agent found!');
    console.log('📊 Agent ID:', agentData.agent_id);
    console.log('📝 Agent Name:', agentData.name);
    
    // Check data collection configuration
    const dataCollection = agentData.platform_settings?.data_collection;
    if (dataCollection) {
      console.log('📋 Data collection fields:');
      Object.entries(dataCollection).forEach(([key, config]) => {
        console.log(`   - ${key}: ${config.description}`);
      });
      
      // Verify required fields
      const requiredFields = ['character_name', 'special_ability', 'favorite_activity'];
      const hasAllFields = requiredFields.every(field => dataCollection[field]);
      
      if (hasAllFields) {
        console.log('✅ All required character fields are configured!');
      } else {
        console.log('❌ Missing required fields:', 
          requiredFields.filter(field => !dataCollection[field]));
      }
    } else {
      console.log('❌ No data collection configuration found');
    }
    
    // Save response for reference
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(outputDir, `character-details-agent-verify-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(agentData, null, 2));
    console.log('💾 Agent configuration saved to:', outputPath);
    
  } catch (error) {
    console.error('❌ Failed to verify agent:', error);
    process.exit(1);
  }
}

// Run the verification
verifyCharacterDetailsAgent();
