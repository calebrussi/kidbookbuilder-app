require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = 'https://api.elevenlabs.io/v1';
const BETA_URL = 'https://api.elevenlabs.io/beta';

async function createPermanentAgent(config) {
    try {
        const response = await axios.post(`${BETA_URL}/agents`, {
            name: config.agentName || 'Story Preference Agent',
            description: config.description || 'An agent that helps children explore story preferences',
            image_url: config.imageUrl,
            initial_message: config.initialMessage,
            role_definition: config.roleDefinition,
            voice_id: config.voiceId,
            configuration: {
                temperature: config.temperature || 0.7,
                prompt_optimization: true,
                conversation_memory: true,
                instant_response: false
            }
        }, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Permanent agent created successfully:', response.data);
        return response.data;
    } catch (error) {
        console.warn('Failed to create permanent agent:', error.message);
        console.log('Falling back to conversation mode...');
        return null;
    }
}

async function testApiAccess() {
    try {
        const response = await axios.get(`${BASE_URL}/voices`, {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            }
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

async function initializeConversation(config) {
    try {
        const { StoryPreferencesClient } = require('./wsClient');
        const client = new StoryPreferencesClient(ELEVENLABS_API_KEY, config);
        await client.connect();

        // Return the client instance for later use
        return {
            client,
            config,
            startTime: new Date().toISOString()
        };

        return response.data;
    } catch (error) {
        console.error('Error initializing conversation:', error.response?.data || error.message);
        throw error;
    }
}

async function createAgent(configFilePath) {
    try {
        // First verify API access
        const hasAccess = await testApiAccess();
        if (!hasAccess) {
            throw new Error('Unable to access ElevenLabs API. Please check your API key.');
        }

        // Read the configuration file
        const configFile = fs.readFileSync(configFilePath, 'utf8');
        const config = JSON.parse(configFile);

        // Try to create a permanent agent first
        const permanentAgent = await createPermanentAgent(config);
        
        if (permanentAgent) {
            // Store the permanent agent data
            const outputFile = path.join(__dirname, 'permanent_agent_config.json');
            fs.writeFileSync(outputFile, JSON.stringify(permanentAgent, null, 2));
            console.log(`Permanent agent configuration saved to ${outputFile}`);
            return permanentAgent;
        }
        
        // Fall back to conversation mode if permanent agent creation fails
        const conversationData = await initializeConversation(config);
        
        // Store the conversation data in a file for later use
        const outputFile = path.join(__dirname, 'conversation_config.json');
        fs.writeFileSync(outputFile, JSON.stringify(conversationData, null, 2));
        console.log(`Conversation configuration saved to ${outputFile}`);

        return conversationData;
    } catch (error) {
        console.error('Error creating agent:', error.response?.data || error.message);
        throw error;
    }
}

// Get the config file from command line argument or use default
function getConfigPath() {
    const configName = process.argv[2];
    if (!configName) {
        console.error('Usage: node createAgent.js <configFileName>');
        console.error('Example: node createAgent.js basicStoryPlotConfig.json');
        console.error('\nMake sure you are in the step-3-prompt-orchestration directory:');
        console.error('cd /Users/calebrussi/Sites/Proj_KidBookBuilder/outputs/implementation_v2/step-3-prompt-orchestration');
        process.exit(1);
    }
    
    const configPath = path.join(__dirname, 'agent_prompts', configName);
    const absolutePath = path.resolve(configPath);
    return absolutePath;
}

async function main() {
    try {
        const configPath = process.argv[2];
        if (!configPath) {
            throw new Error('Please provide a config file path');
        }

        // Try to find the config file
        let absoluteConfigPath = path.resolve(process.cwd(), configPath);
        if (!fs.existsSync(absoluteConfigPath)) {
            // Try looking in the agent_prompts directory
            const altPath = path.resolve(process.cwd(), 'agent_prompts', path.basename(configPath));
            if (fs.existsSync(altPath)) {
                absoluteConfigPath = altPath;
            } else {
                console.error(`Config file not found at:\n- ${absoluteConfigPath}\n- ${altPath}`);
                
                // List available configs
                const configDir = path.resolve(process.cwd(), 'agent_prompts');
                if (fs.existsSync(configDir)) {
                    const files = fs.readdirSync(configDir);
                    console.log('\nAvailable configs in agent_prompts/:');
                    files.forEach(file => console.log(`- ${file}`));
                }
                
                process.exit(1);
            }
        }

        const agent = await createAgent(absoluteConfigPath);
        console.log('Agent created successfully:', agent);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Only run if this file is being run directly
if (require.main === module) {
    if (!ELEVENLABS_API_KEY) {
        console.error('Please set ELEVENLABS_API_KEY environment variable');
        process.exit(1);
    }

    const configPath = getConfigPath();
    
    // Check if file exists
    if (!fs.existsSync(configPath)) {
        console.error(`Config file not found: ${configPath}`);
        console.error('Available configs:');
        const configs = fs.readdirSync(path.join(__dirname, 'agent_prompts'))
            .filter(file => file.endsWith('.json'));
        configs.forEach(config => console.error(`- ${config}`));
        process.exit(1);
    }

    createAgent(configPath)
        .then(() => console.log('Done!'))
        .catch(err => {
            console.error('Failed to create agent:', err);
            process.exit(1);
        });
}
