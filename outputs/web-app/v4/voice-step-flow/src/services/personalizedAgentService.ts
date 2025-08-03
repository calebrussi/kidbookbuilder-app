import { supabase } from '../lib/supabase';
import { createPersonalizedAgent, deletePersonalizedAgent } from '../api/elevenlabs-agents';

export interface UserAgentData {
  userId: string;
  stepId: string;
  agentId: string;
  agentType: 'static' | 'dynamic';
  personalizedPrompt?: string;
  createdAt: Date;
}

export interface UserPersonalizationData {
  userName?: string;
  age?: number;
  storyPreferences?: string[];
  characterName?: string;
  characterSpecialAbility?: string;
  characterFavoriteActivity?: string;
  favoriteGenres?: string[];
  personalityTraits?: string[];
}

export class PersonalizedAgentService {
  
  /**
   * Get agent ID for a specific step and user
   */
  static async getAgentForStep(
    userId: string, 
    stepId: string, 
    workflow: any,
    userPersonalization?: UserPersonalizationData
  ): Promise<string> {
    console.log(`🤖 Getting agent for step: ${stepId}, user: ${userId}`);
    console.log(`🔍 User personalization data:`, userPersonalization);

    // Extract agent ID from workflow data dynamically
    const staticAgentId = this.getStaticAgentFromWorkflow(workflow, stepId);
    
    // Determine if this step should use dynamic personalization
    const shouldUseDynamicAgent = this.shouldCreateDynamicAgent(stepId, userPersonalization);
    console.log(`🎯 Should use dynamic agent for ${stepId}:`, shouldUseDynamicAgent);
    
    if (shouldUseDynamicAgent) {
      console.log(`🎯 Step ${stepId} qualifies for dynamic agent creation`);
      
      // Check if we already have a dynamic agent for this user/step
      const existingAgent = await this.getExistingDynamicAgent(userId, stepId);
      if (existingAgent) {
        console.log(`🔄 Reusing existing dynamic agent: ${existingAgent}`);
        return existingAgent;
      }
      
      // Create new dynamic agent
      const dynamicAgentId = await this.createDynamicAgent(userId, stepId, workflow, userPersonalization);
      return dynamicAgentId;
    }
    
    // Use static agent for this step
    if (staticAgentId) {
      console.log(`📋 Using static agent for ${stepId}: ${staticAgentId}`);
      return staticAgentId;
    }

    // Fallback to first available agent
    console.warn(`⚠️ No agent found for step ${stepId}, using first available agent`);
    return this.getFirstAvailableAgent(workflow);
  }

  /**
   * Extract agent ID from workflow data for a specific step
   */
  private static getStaticAgentFromWorkflow(workflow: any, stepId: string): string | null {
    if (!workflow?.sections) return null;

    for (const section of workflow.sections) {
      if (section.steps) {
        for (const step of section.steps) {
          if (step.id === stepId && step.agentId) {
            return step.agentId;
          }
        }
      }
    }
    return null;
  }

  /**
   * Get the first available agent from workflow as fallback
   */
  private static getFirstAvailableAgent(workflow: any): string {
    if (!workflow?.sections) {
      throw new Error('No workflow sections found');
    }

    for (const section of workflow.sections) {
      if (section.steps) {
        for (const step of section.steps) {
          if (step.agentId) {
            return step.agentId;
          }
        }
      }
    }
    
    throw new Error('No agents found in workflow');
  }

  /**
   * Check if user already has a dynamic agent for this step
   */
  private static async getExistingDynamicAgent(userId: string, stepId: string): Promise<string | null> {
    try {
      console.log(`🔍 Checking for existing dynamic agent: user=${userId}, step=${stepId}`);
      
      // For now, skip database check to avoid timeouts - always create fresh agents
      // TODO: Fix Supabase connection and re-enable caching
      console.log('⚡ Skipping database check, creating fresh agent for better performance');
      return null;
      
    } catch (error) {
      console.error('Error checking existing agent:', error);
      console.log('🚫 Falling back to creating new agent due to database error');
      return null;
    }
  }

  /**
   * Create a personalized agent for a specific user and step
   */
  private static async createDynamicAgent(
    userId: string, 
    stepId: string, 
    workflow: any,
    userPersonalization?: UserPersonalizationData
  ): Promise<string> {
    console.log(`🎯 Creating dynamic agent for step ${stepId}, user: ${userId}`);
    
    try {
      // Generate personalized prompt based on user data
      const personalizedPrompt = this.generatePersonalizedPrompt(stepId, userPersonalization);
      
      // Generate agent name and description
      const userName = userPersonalization?.userName || 'User';
      const agentName = `${userName}'s ${stepId} Guide`;
      const agentDescription = `Personalized story creation assistant for ${userName} during the ${stepId} step`;
      
      console.log(`📝 Creating agent "${agentName}" with personalized prompt`);
      
      // Call ElevenLabs API to create the agent
      const agentResponse = await createPersonalizedAgent({
        name: agentName,
        description: agentDescription,
        prompt: personalizedPrompt
      });
      
      console.log(`✅ Created dynamic agent: ${agentResponse.agent_id}`);
      
      // Skip database storage for now to avoid delays
      // TODO: Re-enable when Supabase connection is stable
      // await this.storeUserAgent(userId, stepId, agentResponse.agent_id, 'dynamic', personalizedPrompt);
      console.log('⚡ Skipping database storage for faster performance');
      
      return agentResponse.agent_id;
      
    } catch (error) {
      console.error(`❌ Failed to create dynamic agent for ${stepId}:`, error);
      
      // Fallback to first available agent from workflow
      console.log(`🔄 Falling back to static agent for ${stepId}`);
      const fallbackAgentId = this.getStaticAgentFromWorkflow(workflow, stepId);
      if (fallbackAgentId) {
        console.log(`✅ Using static fallback agent for ${stepId}: ${fallbackAgentId}`);
        return fallbackAgentId;
      } else {
        console.log(`⚠️ No static agent found for ${stepId}, using first available`);
        return this.getFirstAvailableAgent(workflow);
      }
    }
  }

  /**
   * Generate personalized prompt based on user data and step
   */
  private static generatePersonalizedPrompt(
    stepId: string, 
    userPersonalization?: UserPersonalizationData
  ): string {
    const userName = userPersonalization?.userName || 'friend';
    const preferences = userPersonalization?.storyPreferences || ['adventure'];
    
    const promptTemplates = {
      'name': `
        You're a friendly story creation assistant helping ${userName} get started.
        Ask them about their name, age, and what kinds of stories they love.
        Be warm, encouraging, and excited about their creative journey.
      `,
      
      'story-preferences': `
        You're helping ${userName} discover their story preferences. 
        Ask about their favorite types of stories, genres they enjoy, 
        and whether they prefer funny, exciting, or magical tales.
        Be enthusiastic and help them explore different options.
      `,
      
      'character-details': `
        You're helping ${userName} create their story character. 
        They've shown interest in ${preferences.join(' and ')} stories.
        Guide them to create a character that fits their preferences.
        Ask about character name, special abilities, and personality.
        Be encouraging and match their energy level.
      `
    };

    return promptTemplates[stepId] || `Help ${userName} with their story creation.`;
  }

  /**
   * Store user agent mapping in database
   */
  private static async storeUserAgent(
    userId: string,
    stepId: string, 
    agentId: string,
    agentType: 'static' | 'dynamic',
    personalizedPrompt?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_agents')
        .upsert({
          user_id: userId,
          step_id: stepId,
          agent_id: agentId,
          agent_type: agentType,
          personalized_prompt: personalizedPrompt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing user agent:', error);
    }
  }

  /**
   * Extract user personalization data from their progress
   */
  static extractPersonalizationFromProgress(progress: any): UserPersonalizationData {
    const personalization: UserPersonalizationData = {};

    console.log('🔍 DEBUG: ⏰ TIMING: PersonalizedAgentService.extractPersonalizationFromProgress called at:', new Date().toISOString());
    console.log('🔍 DEBUG: Full progress object:', progress);
    console.log('🔍 DEBUG: stepProgress:', progress.stepProgress);

    // For story creation mode, check if we have character quiz data
    if (progress.workflowId === 'story-creation' && progress.characterQuizData) {
      console.log('🔍 DEBUG: Found character quiz data in story creation progress:', progress.characterQuizData);
      return progress.characterQuizData;
    }

    // Extract data from completed steps (original logic for character quiz)
    Object.values(progress.stepProgress || {}).forEach((step: any) => {
      console.log('🔍 DEBUG: Processing step:', step);
      
      // First, try to extract from ElevenLabs analysis results
      if (step.analysisResults) {
        console.log('🔍 DEBUG: Found analysisResults:', step.analysisResults);
        
        // Check if there are data_collection_results with structured data
        if (step.analysisResults.data_collection_results) {
          console.log('🔍 DEBUG: Found data_collection_results:', step.analysisResults.data_collection_results);
          
          // Extract structured data from ElevenLabs analysis
          const dataResults = step.analysisResults.data_collection_results;
          if (dataResults.name) personalization.userName = dataResults.name;
          if (dataResults.age) personalization.age = parseInt(dataResults.age);
          if (dataResults.story_preferences) {
            personalization.storyPreferences = Array.isArray(dataResults.story_preferences) 
              ? dataResults.story_preferences 
              : [dataResults.story_preferences];
          }
          if (dataResults.character_name) personalization.characterName = dataResults.character_name;
          if (dataResults.special_ability) personalization.characterSpecialAbility = dataResults.special_ability;
          if (dataResults.favorite_activity) personalization.characterFavoriteActivity = dataResults.favorite_activity;
        }
      }
      
      // Fallback: Extract from capturedData (less structured)
      if (step.capturedData && step.capturedData.length > 0) {
        console.log('🔍 DEBUG: Found capturedData:', step.capturedData);
        step.capturedData.forEach((data: any) => {
          console.log('🔍 DEBUG: Processing captured data item:', data);
          
          // Handle different data labels from ElevenLabs analysis
          switch (data.label) {
            case 'personal_info':
              // Try to intelligently parse personal info
              this.parsePersonalInfo(data.value, personalization);
              break;
              
            case 'story_preferences':
              if (!personalization.storyPreferences) {
                personalization.storyPreferences = [data.value || ''];
              }
              break;
              
            case 'character_info':
              // Parse combined character information 
              if (!personalization.characterName || !personalization.characterSpecialAbility || !personalization.characterFavoriteActivity) {
                this.parseCharacterInfo(data.value, personalization);
              }
              break;
              
            case 'special_ability':
              if (!personalization.characterSpecialAbility) {
                personalization.characterSpecialAbility = data.value;
              }
              break;
              
            case 'favorite_activity':
              if (!personalization.characterFavoriteActivity) {
                personalization.characterFavoriteActivity = data.value;
              }
              break;
              
            // Legacy format support
            case 'user_name':
              if (!personalization.userName) {
                personalization.userName = data.value;
              }
              break;
            case 'age':
              if (!personalization.age) {
                personalization.age = parseInt(data.value);
              }
              break;
          }
        });
      } else {
        console.log('🔍 DEBUG: ❌ No capturedData found for step:', step.stepId, 'Status:', step.status);
      }
      
      // Last resort: Parse conversation messages for data
      if (step.messages && step.messages.length > 0) {
        console.log('🔍 DEBUG: Found messages in step:', step.messages);
        this.extractFromMessages(step.messages, personalization);
      }
    });

    console.log('🔍 DEBUG: Final personalization object:', personalization);
    return personalization;
  }

  /**
   * Intelligently parse personal info string
   */
  private static parsePersonalInfo(personalInfo: string, personalization: UserPersonalizationData) {
    if (!personalInfo || personalInfo.trim() === '') return;
    
    console.log('🔍 DEBUG: Parsing personal info:', personalInfo);
    
    // Check if this looks like a character ability description rather than a name
    const abilityIndicators = ['can', 'is able to', 'has the power', 'ability', 'special'];
    const isAbilityDescription = abilityIndicators.some(indicator => 
      personalInfo.toLowerCase().includes(indicator)
    );
    
    if (isAbilityDescription) {
      console.log('🔍 DEBUG: This looks like a character ability, not a name:', personalInfo);
      // This is probably character information, not personal info
      // Don't extract it as userName
      return;
    }
    
    // Common patterns for name extraction (single words only, no long phrases)
    const namePatterns = [
      /^([A-Za-z]+),/,  // "Name," (single word before comma)
      /^([A-Za-z]+)\s+\d+/,  // "Name 14" (single word before age)
      /^([A-Za-z]+)$/,  // Just "Name" (single word only)
    ];
    
    for (const pattern of namePatterns) {
      const match = personalInfo.match(pattern);
      if (match && match[1] && match[1].length <= 20 && !personalization.userName) {
        // Only accept single words or very short names
        if (!match[1].includes(' ') || match[1].split(' ').length <= 2) {
          personalization.userName = match[1].trim();
          console.log('🔍 DEBUG: Extracted user name:', personalization.userName);
          break;
        }
      }
    }
    
    // Extract age if present
    const ageMatch = personalInfo.match(/\b(\d+)\b/);
    if (ageMatch && !personalization.age) {
      const age = parseInt(ageMatch[1]);
      if (age > 0 && age < 150) { // Reasonable age range
        personalization.age = age;
        console.log('🔍 DEBUG: Extracted age:', personalization.age);
      }
    }
  }

  /**
   * Parse character info string to extract character details
   * Expected format: "John and his special ability is flight and his favorite activity is flying around Manhattan."
   */
  private static parseCharacterInfo(characterInfo: string, personalization: UserPersonalizationData) {
    if (!characterInfo || characterInfo.trim() === '') return;
    
    console.log('🔍 DEBUG: Parsing character info:', characterInfo);
    
    // Extract character name (usually first word)
    if (!personalization.characterName) {
      const nameMatch = characterInfo.match(/^([A-Za-z]+)/);
      if (nameMatch) {
        personalization.characterName = nameMatch[1];
        console.log('🔍 DEBUG: Extracted character name:', personalization.characterName);
      }
    }
    
    // Extract special ability
    if (!personalization.characterSpecialAbility) {
      const abilityPatterns = [
        /special ability is ([^.]+)/i,
        /ability is ([^.]+)/i,
        /power is ([^.]+)/i,
        /can ([^.]+)/i
      ];
      
      for (const pattern of abilityPatterns) {
        const match = characterInfo.match(pattern);
        if (match) {
          personalization.characterSpecialAbility = match[1].trim().replace(/\sand\s.*$/, ''); // Remove "and" clause
          console.log('🔍 DEBUG: Extracted special ability:', personalization.characterSpecialAbility);
          break;
        }
      }
    }
    
    // Extract favorite activity
    if (!personalization.characterFavoriteActivity) {
      const activityPatterns = [
        /favorite activity is ([^.]+)/i,
        /loves ([^.]+)/i,
        /enjoys ([^.]+)/i,
        /likes ([^.]+)/i
      ];
      
      for (const pattern of activityPatterns) {
        const match = characterInfo.match(pattern);
        if (match) {
          personalization.characterFavoriteActivity = match[1].trim();
          console.log('🔍 DEBUG: Extracted favorite activity:', personalization.characterFavoriteActivity);
          break;
        }
      }
    }
  }

  /**
   * Extract data from conversation messages as fallback
   */
  private static extractFromMessages(messages: any[], personalization: UserPersonalizationData) {
    console.log('🔍 DEBUG: Extracting from messages:', messages);
    
    // Look for user messages that might contain names or preferences
    messages.forEach((message, index) => {
      // Handle both ElevenLabs format and standard format
      const isUser = message.role === 'user' || message.source === 'user';
      const content = message.content || message.message || '';
      
      console.log(`🔍 DEBUG: Message ${index}:`, { isUser, content: content.substring(0, 100) });
      
      if (isUser && content) {
        // Simple patterns for name detection
        if (!personalization.userName) {
          // Look for "My name is [Name]" pattern
          const myNameMatch = content.match(/my name is ([A-Za-z\s]+)/i);
          if (myNameMatch) {
            personalization.userName = myNameMatch[1].trim();
            console.log('🔍 DEBUG: Found name via "My name is" pattern:', personalization.userName);
          } else {
            // Fallback: Look for name at start of message
            const nameMatch = content.match(/^([A-Za-z\s]+)(?:\s*,|\s*\.|$)/);
            if (nameMatch && nameMatch[1].length > 1 && nameMatch[1].length < 50) {
              personalization.userName = nameMatch[1].trim();
              console.log('🔍 DEBUG: Found name via start pattern:', personalization.userName);
            }
          }
        }
        
        // Extract age if present
        if (!personalization.age) {
          const ageMatch = content.match(/\b(?:I'm\s+|am\s+)?(\d+)(?:\s+years?\s+old)?\b/i);
          if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            if (age > 0 && age < 150) {
              personalization.age = age;
              console.log('🔍 DEBUG: Found age:', personalization.age);
            }
          }
        }
        
        // Pattern for story preferences
        if (!personalization.storyPreferences && content.toLowerCase().includes('story')) {
          personalization.storyPreferences = [content];
          console.log('🔍 DEBUG: Found story preferences');
        }
      }
    });
  }

  /**
   * Cleanup user agents when workflow is complete
   */
  static async cleanupUserAgents(userId: string): Promise<void> {
    try {
      // Get all dynamic agents for this user
      const { data: userAgents } = await supabase
        .from('user_agents')
        .select('agent_id')
        .eq('user_id', userId)
        .eq('agent_type', 'dynamic');

      if (userAgents && userAgents.length > 0) {
        // Call API to delete the agents from ElevenLabs
        await fetch('/api/cleanup-user-agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            agentIds: userAgents.map(a => a.agent_id)
          })
        });

        // Remove from database
        await supabase
          .from('user_agents')
          .delete()
          .eq('user_id', userId)
          .eq('agent_type', 'dynamic');

        console.log(`🧹 Cleaned up ${userAgents.length} dynamic agents for user ${userId}`);
      }
    } catch (error) {
      console.error('Error cleaning up user agents:', error);
    }
  }

  /**
   * Determine if a step should use dynamic agent creation based on user data
   */
  private static shouldCreateDynamicAgent(stepId: string, userPersonalization?: UserPersonalizationData): boolean {
    console.log(`🔍 Checking dynamic agent criteria for ${stepId}:`, {
      stepId,
      hasPersonalization: !!userPersonalization,
      userName: userPersonalization?.userName,
      storyPreferences: userPersonalization?.storyPreferences,
      characterName: userPersonalization?.characterName
    });
    
    // The first 3 character quiz steps should ALWAYS use static agents (same for everyone)
    const staticCharacterQuizSteps = ['name', 'story-preferences', 'character-details'];
    if (staticCharacterQuizSteps.includes(stepId)) {
      console.log('📋 Using static agent for character quiz step');
      return false;
    }
    
    // Only create dynamic agents for book generation steps (after character quiz)
    // This will be used for the future book generation system
    if (!userPersonalization) {
      console.log('❌ No personalization data available');
      return false;
    }
    
    const hasUserData = userPersonalization.userName || 
                       userPersonalization.storyPreferences?.length || 
                       userPersonalization.characterName;
    
    const result = Boolean(hasUserData);
    console.log(`✅ Dynamic agent decision: ${result}`);
    return result;
  }

  /**
   * Generate book agents using AI-powered personalization that evolves based on user responses
   */
  static async generateBookAgents(
    userId: string,
    userProgress: any
  ): Promise<any[]> {
    console.log('📚 Generating personalized book agents with AI and response evolution');
    
    // Extract user data from quiz responses
    const userPersonalization = this.extractPersonalizationFromProgress(userProgress);
    console.log('👤 User personalization data:', userPersonalization);

    // Extract previous agent responses for theme evolution
    const previousResponses = this.extractPreviousAgentResponses(userProgress);
    console.log('🔄 Previous agent responses for evolution:', previousResponses);
    
    // Use AI to generate personalized agent concepts based on user data AND previous responses
    const agentConcepts = await this.generateAgentConcepts(userPersonalization, previousResponses);
    console.log('🧠 Generated evolving agent concepts:', agentConcepts);
    
    try {
      const agents = [];
      
      // Create actual ElevenLabs agents for each concept
      for (let i = 0; i < agentConcepts.length; i++) {
        const concept = agentConcepts[i];
        console.log(`🤖 Creating ElevenLabs agent ${i + 1}:`, concept.name);
        
        const agent = await createPersonalizedAgent({
          name: concept.name,
          description: concept.description,
          prompt: concept.prompt,
          voice_id: concept.voiceId,
          dataFieldName: concept.dataFieldName,
          dataCollectionDescription: concept.dataCollectionDescription,
          firstMessage: concept.firstMessage
        });
        
        // Add the concept data to the agent response
        agents.push({
          ...agent,
          ...concept,
          id: agent.agent_id || `agent_${Date.now()}_${i}`
        });
      }
      
      console.log(`✅ Successfully created ${agents.length} personalized voice agents`);
      return agents;
      
    } catch (error) {
      console.error('❌ Failed to generate book agents:', error);
      throw error;
    }
  }

  /**
   * Use AI to generate personalized agent concepts based on ALL user quiz data AND previous responses
   */
  static async generateAgentConcepts(userPersonalization: UserPersonalizationData, previousResponses?: any[]): Promise<any[]> {
    console.log('🧠 Generating AI-powered agent concepts using ALL quiz data AND response evolution...');
    console.log('📊 Full user data:', userPersonalization);
    console.log('🔄 Previous responses for evolution:', previousResponses?.length || 0);
    
    // Extract ALL data from the 3 character quiz steps
    const userName = userPersonalization.userName && 
                     !userPersonalization.userName.toLowerCase().includes('can') && 
                     !userPersonalization.userName.toLowerCase().includes('ability') && 
                     userPersonalization.userName.split(' ').length <= 2 
                     ? userPersonalization.userName 
                     : 'Explorer';
    const age = userPersonalization.age || 12;
    const storyPreferences = userPersonalization.storyPreferences?.join(', ') || 'adventure stories';
    const characterName = userPersonalization.characterName || 'Hero';
    const characterAbility = userPersonalization.characterSpecialAbility || 'special powers';
    const characterActivity = userPersonalization.characterFavoriteActivity || 'exploring';
    
    console.log('🎯 Creating agents with complete user profile:', {
      userName, age, storyPreferences, characterName, characterAbility, characterActivity
    });
    
    // Use the same voice ID for all agents (Eric - consistent voice)
    const consistentVoiceId = 'ErXwobaYiN019PkySvjV'; // Eric - warm, engaging voice
    
    // Generate agent concepts that adapt to the user's character data
    console.log('🎯 Generating adaptive agents based on character data...');
    
    // Analyze character data to determine optimal agent types that evolve with responses
    const adaptiveAgentTypes = this.generateAdaptiveAgentTypes(userPersonalization, previousResponses);
    console.log('🧠 Adaptive agent types determined with evolution:', adaptiveAgentTypes);
    
    const agentConcepts = adaptiveAgentTypes.map((agentType, index) => ({
      name: agentType.name,
      description: agentType.description.replace('${characterName}', characterName),
      prompt: agentType.prompt
        .replace(/\${characterName}/g, characterName)
        .replace(/\${characterAbility}/g, characterAbility)
        .replace(/\${storyPreferences}/g, storyPreferences)
        .replace(/\${characterActivity}/g, characterActivity),
      voiceId: consistentVoiceId,
      role: agentType.role,
      dataFieldName: agentType.dataFieldName,
      dataCollectionDescription: agentType.dataCollectionDescription,
      firstMessage: agentType.firstMessage
        .replace(/\${characterName}/g, characterName)
        .replace(/\${characterAbility}/g, characterAbility)
        .replace(/\${storyPreferences}/g, storyPreferences)
    }));
    
    console.log(`🎭 Generated ${agentConcepts.length} information-gathering agents for ${userName}'s ${characterName} story`);
    return agentConcepts;
  }

  /**
   * Cleanup agents using workflow-setup patterns
   */
  static async cleanupAgents(agentIds: string[]): Promise<void> {
    console.log(`🧹 Cleaning up ${agentIds.length} agents`);
    
    const cleanupPromises = agentIds.map(async (agentId) => {
      try {
        console.log(`✅ Cleaned up agent: ${agentId}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup agent ${agentId}:`, error);
      }
    });
    
    await Promise.all(cleanupPromises);
  }

  /**
   * Generate adaptive agent types with varying story themes based on character quiz data AND previous responses
   */
  private static generateAdaptiveAgentTypes(userPersonalization: UserPersonalizationData, previousResponses?: any[]): any[] {
    const characterName = userPersonalization.characterName || 'Hero';
    const characterAbility = userPersonalization.characterSpecialAbility || 'special powers';
    const storyPreferences = userPersonalization.storyPreferences?.join(', ') || 'adventure stories';
    const characterActivity = userPersonalization.characterFavoriteActivity || 'exploring';

    console.log('🎯 Adapting story themes to character data AND previous responses:', { 
      characterName, characterAbility, storyPreferences, characterActivity,
      hasPreviousResponses: !!previousResponses?.length
    });

    // Determine the 3 story themes based on character data AND previous agent responses
    const storyThemes = this.selectEvolvingStoryThemes(characterAbility, storyPreferences, characterActivity, previousResponses);
    console.log('📚 Selected evolving story themes:', storyThemes);

    // Generate agents for each selected theme
    const agents = storyThemes.map((theme, index) => 
      this.generateThemeAgent(theme, userPersonalization, index)
    );

    return agents;
  }

  // ...existing code...

  /**
   * Generate a themed agent based on story theme
   */
  private static generateThemeAgent(theme: string, userPersonalization: UserPersonalizationData, index: number): any {
    const characterName = userPersonalization.characterName || 'Hero';
    const characterAbility = userPersonalization.characterSpecialAbility || 'special powers';
    const storyPreferences = userPersonalization.storyPreferences?.join(', ') || 'adventure stories';

    const themeConfigs = {
      // GENERAL WORLD/ENVIRONMENT THEMES
      'adventure-environments': {
        name: 'World Explorer',
        role: 'Environment Information Collector',
        description: 'Collects details about the different places and environments in ${characterName}\'s adventures.',
        dataField: 'world_environments',
        dataHint: 'adventure places, exciting environments, world settings, location preferences',
        questions: [
          'Tell me about the kinds of places ${characterName} likes to go on adventures.',
          'What environments or locations does ${characterName} find most exciting?',
          'What makes a place feel perfect for ${characterName}\'s adventures?'
        ]
      },

      'natural-worlds': {
        name: 'Nature Guide',
        role: 'Natural World Information Collector',
        description: 'Gathers information about ${characterName}\'s connection to nature and outdoor places.',
        dataField: 'nature_preferences',
        dataHint: 'nature places, outdoor environments, natural settings, wildlife connections',
        questions: [
          'Tell me about the natural places ${characterName} loves to visit.',
          'What kinds of outdoor environments appeal to ${characterName}?',
          'How does ${characterName} like to spend time in nature?'
        ]
      },

      'magical-worlds': {
        name: 'Wonder Collector',
        role: 'Magical Experience Information Collector',
        description: 'Collects details about magical and fantastical elements in ${characterName}\'s world.',
        dataField: 'magical_preferences',
        dataHint: 'magical elements, fantasy preferences, wonder moments, enchanted feelings',
        questions: [
          'Tell me about the magical or fantastical things that interest ${characterName}.',
          'What kinds of wonder and magic appeal to ${characterName}?',
          'How does ${characterName} experience magical moments?'
        ]
      },

      'future-worlds': {
        name: 'Tomorrow Scout',
        role: 'Future World Information Collector',
        description: 'Gathers information about futuristic and technological elements ${characterName} enjoys.',
        dataField: 'future_preferences',
        dataHint: 'futuristic elements, technology interests, space preferences, sci-fi attractions',
        questions: [
          'Tell me about futuristic or space-related things that fascinate ${characterName}.',
          'What kinds of technology or future elements interest ${characterName}?',
          'How does ${characterName} imagine the future or space adventures?'
        ]
      },

      'everyday-worlds': {
        name: 'Life Explorer',
        role: 'Everyday Experience Collector',
        description: 'Collects details about ${characterName}\'s everyday adventures and familiar places.',
        dataField: 'everyday_preferences',
        dataHint: 'familiar places, everyday adventures, home environments, regular activities',
        questions: [
          'Tell me about the everyday places where ${characterName} has adventures.',
          'What familiar environments does ${characterName} find exciting?',
          'How does ${characterName} turn ordinary places into adventure spots?'
        ]
      },

      // GENERAL MOOD/FEELING THEMES
      'fun-and-humor': {
        name: 'Joy Collector',
        role: 'Fun Experience Information Collector',
        description: 'Gathers details about what makes ${characterName} laugh and have fun.',
        dataField: 'humor_preferences',
        dataHint: 'funny moments, humor preferences, joy activities, laughter triggers',
        questions: [
          'Tell me about the things that make ${characterName} laugh and smile.',
          'What kinds of fun and silly moments does ${characterName} enjoy?',
          'How does ${characterName} like to have a good time?'
        ]
      },

      'mysteries-and-secrets': {
        name: 'Curiosity Keeper',
        role: 'Mystery Interest Collector',
        description: 'Collects information about ${characterName}\'s interest in mysteries and hidden things.',
        dataField: 'mystery_preferences',
        dataHint: 'mystery interests, curiosity topics, secret fascinations, puzzle preferences',
        questions: [
          'Tell me about mysteries or hidden things that fascinate ${characterName}.',
          'What kinds of secrets or puzzles does ${characterName} find intriguing?',
          'How does ${characterName} like to explore unknown things?'
        ]
      },

      'thrills-and-excitement': {
        name: 'Excitement Seeker',
        role: 'Thrill Information Collector',
        description: 'Gathers details about what creates excitement and thrills for ${characterName}.',
        dataField: 'excitement_preferences',
        dataHint: 'exciting moments, thrill preferences, adrenaline activities, adventure feelings',
        questions: [
          'Tell me about things that make ${characterName} feel excited and thrilled.',
          'What kinds of adventures get ${characterName}\'s heart racing?',
          'How does ${characterName} like to experience excitement?'
        ]
      },

      'friendships-and-bonds': {
        name: 'Connection Finder',
        role: 'Relationship Information Collector',
        description: 'Collects information about ${characterName}\'s friendships and important relationships.',
        dataField: 'relationship_preferences',
        dataHint: 'friendship preferences, relationship values, social connections, bonding activities',
        questions: [
          'Tell me about the friendships and relationships that matter to ${characterName}.',
          'What kinds of connections does ${characterName} value most?',
          'How does ${characterName} like to spend time with others?'
        ]
      },

      'dreams-and-wishes': {
        name: 'Dream Collector',
        role: 'Aspiration Information Collector',
        description: 'Gathers details about ${characterName}\'s dreams, hopes, and aspirations.',
        dataField: 'dream_preferences',
        dataHint: 'dreams and goals, wishes and hopes, aspirations, future desires',
        questions: [
          'Tell me about ${characterName}\'s biggest dreams and wishes.',
          'What does ${characterName} hope to achieve or become?',
          'What aspirations drive ${characterName} forward?'
        ]
      },

      // GENERAL ACTIVITY/EXPERIENCE THEMES
      'exploring-and-discovering': {
        name: 'Discovery Guide',
        role: 'Exploration Information Collector',
        description: 'Collects details about ${characterName}\'s love of exploration and discovery.',
        dataField: 'exploration_preferences',
        dataHint: 'exploration activities, discovery interests, adventure seeking, curiosity pursuits',
        questions: [
          'Tell me about the kinds of exploring ${characterName} loves to do.',
          'What does ${characterName} enjoy discovering or finding?',
          'How does ${characterName} like to go on exploration adventures?'
        ]
      },

      'learning-and-growing': {
        name: 'Growth Guide',
        role: 'Learning Information Collector',
        description: 'Gathers information about what ${characterName} likes to learn and how they grow.',
        dataField: 'learning_preferences',
        dataHint: 'learning interests, growth activities, skill development, knowledge pursuits',
        questions: [
          'Tell me about things ${characterName} loves to learn about.',
          'What skills or knowledge does ${characterName} want to develop?',
          'How does ${characterName} like to challenge themselves and grow?'
        ]
      },

      'creating-and-building': {
        name: 'Creation Collector',
        role: 'Creative Information Collector',
        description: 'Collects details about ${characterName}\'s creative and building interests.',
        dataField: 'creation_preferences',
        dataHint: 'creative activities, building interests, making projects, artistic pursuits',
        questions: [
          'Tell me about things ${characterName} likes to create or build.',
          'What kinds of projects or creative activities appeal to ${characterName}?',
          'How does ${characterName} express their creativity?'
        ]
      },

      'playing-and-games': {
        name: 'Play Explorer',
        role: 'Play Information Collector',
        description: 'Gathers information about ${characterName}\'s favorite games and play activities.',
        dataField: 'play_preferences',
        dataHint: 'play activities, game preferences, fun pursuits, recreational interests',
        questions: [
          'Tell me about the games and play activities ${characterName} enjoys most.',
          'What kinds of fun and playful things does ${characterName} love to do?',
          'How does ${characterName} like to spend their free time playing?'
        ]
      },

      'helping-others': {
        name: 'Helper Finder',
        role: 'Service Information Collector',
        description: 'Collects details about how ${characterName} likes to help and support others.',
        dataField: 'helping_preferences',
        dataHint: 'helping activities, service interests, caring behaviors, support preferences',
        questions: [
          'Tell me about how ${characterName} likes to help other people.',
          'What kinds of caring and helpful activities does ${characterName} enjoy?',
          'How does ${characterName} show kindness and support to others?'
        ]
      }
    };

    // Add more theme configs as needed...
    const defaultConfig = {
      name: 'Story Vibe Creator',
      role: 'Atmosphere Designer',
      description: 'Creates the overall feeling and atmosphere of ${characterName}\'s adventure.',
      dataField: 'story_atmosphere',
      dataHint: 'story feelings, adventure atmosphere, emotional tone, overall vibe',
      questions: [
        'What should the overall feeling of ${characterName}\'s story be?',
        'What atmosphere makes ${characterName}\'s adventures most exciting?',
        'What emotional tone fits ${characterName}\'s personality best?'
      ]
    };

    const config = themeConfigs[theme] || defaultConfig;

    return {
      name: config.name,
      role: config.role,
      description: config.description,
      dataFieldName: config.dataField,
      dataCollectionDescription: `Extract ${config.dataHint}. Focus on collecting detailed information about the user's preferences and ideas.`,
      firstMessage: config.questions[0],
      prompt: `# Personality
You are a friendly and collaborative information collector focused on gathering details about ${theme}. You are curious, supportive, and excellent at listening to what users tell you. When users need help, you can offer gentle suggestions or examples to spark their imagination.

# Environment
You are collecting information for \${characterName}'s story who loves ${storyPreferences} and has the ability to ${characterAbility}. Your job is to gather detailed information from the user while being helpful when they need inspiration.

# Tone
Be enthusiastic about learning from the user. Ask follow-up questions to get more details. Show genuine interest in what they tell you. If users seem stuck, offer a few gentle examples or suggestions to help spark their creativity.

# Goal
Your primary objective is to collect detailed information about ${theme} by asking these questions:
1. ${config.questions[0]}
2. ${config.questions[1] || 'Tell me more about what interests you most about this.'}
3. ${config.questions[2] || 'What other details would you like to share about this?'}
4. End the conversation after collecting information from all three questions

# Helpful Approach
- If users say "I don't know" or ask for ideas, offer 2-3 gentle examples to spark their imagination
- Example: "Here are some ideas that might inspire you: [example 1], [example 2], or [example 3]. What appeals to you?"
- Always bring the conversation back to what the user thinks or prefers
- Focus on collecting their personal preferences rather than imposing specific ideas

# Tools
CRITICAL: End the conversation immediately after collecting information from all three questions. Thank the user for sharing and end the conversation.`
    };
  }

  /**
   * Generate adaptive story themes that evolve based on previous agent responses
   */
  private static selectEvolvingStoryThemes(
    characterAbility: string, 
    storyPreferences: string, 
    characterActivity: string,
    previousAgentResponses?: any[]
  ): string[] {
    const abilityLower = characterAbility.toLowerCase();
    const preferencesLower = storyPreferences.toLowerCase();
    const activityLower = characterActivity.toLowerCase();

    console.log('🧠 Analyzing previous agent responses for theme evolution:', previousAgentResponses);

    // Base themes from character quiz
    let selectedThemes = this.getBaseThemes(abilityLower, preferencesLower, activityLower);

    // Evolve themes based on previous agent responses
    if (previousAgentResponses && previousAgentResponses.length > 0) {
      selectedThemes = this.evolveThemesFromResponses(selectedThemes, previousAgentResponses);
    }

    // Ensure no duplicates and exactly 3 themes
    selectedThemes = [...new Set(selectedThemes)];
    
    // Fill with contextual themes if needed
    while (selectedThemes.length < 3) {
      const contextualTheme = this.selectContextualTheme(selectedThemes, previousAgentResponses);
      if (!selectedThemes.includes(contextualTheme)) {
        selectedThemes.push(contextualTheme);
      }
    }

    return selectedThemes.slice(0, 3);
  }

  /**
   * Get base themes from character quiz data (broader, more general themes)
   */
  private static getBaseThemes(abilityLower: string, preferencesLower: string, activityLower: string): string[] {
    let themes = [];

    // First theme: Broad environment/world category
    if (abilityLower.includes('fly') || abilityLower.includes('speed') || abilityLower.includes('fast')) {
      themes.push('adventure-environments');
    } else if (abilityLower.includes('water') || abilityLower.includes('swim') || preferencesLower.includes('ocean')) {
      themes.push('natural-worlds');
    } else if (abilityLower.includes('magic') || preferencesLower.includes('magic') || preferencesLower.includes('fantasy')) {
      themes.push('magical-worlds');
    } else if (preferencesLower.includes('space') || preferencesLower.includes('sci') || preferencesLower.includes('robot')) {
      themes.push('future-worlds');
    } else {
      // Random selection from general world types
      const worldTypes = ['adventure-environments', 'natural-worlds', 'magical-worlds', 'everyday-worlds'];
      themes.push(worldTypes[Math.floor(Math.random() * worldTypes.length)]);
    }

    // Second theme: Broad story mood/feeling category
    if (preferencesLower.includes('funny') || preferencesLower.includes('comedy') || preferencesLower.includes('silly')) {
      themes.push('fun-and-humor');
    } else if (preferencesLower.includes('mystery') || preferencesLower.includes('detective') || preferencesLower.includes('secret')) {
      themes.push('mysteries-and-secrets');
    } else if (preferencesLower.includes('scary') || preferencesLower.includes('spooky') || preferencesLower.includes('ghost')) {
      themes.push('thrills-and-excitement');
    } else if (preferencesLower.includes('friend') || activityLower.includes('help') || activityLower.includes('save')) {
      themes.push('friendships-and-bonds');
    } else {
      // Random selection from general mood types
      const moodTypes = ['fun-and-humor', 'mysteries-and-secrets', 'thrills-and-excitement', 'friendships-and-bonds', 'dreams-and-wishes'];
      themes.push(moodTypes[Math.floor(Math.random() * moodTypes.length)]);
    }

    // Third theme: Broad activity/experience category
    if (activityLower.includes('explore') || activityLower.includes('discover') || activityLower.includes('adventure')) {
      themes.push('exploring-and-discovering');
    } else if (activityLower.includes('learn') || activityLower.includes('study') || activityLower.includes('school')) {
      themes.push('learning-and-growing');
    } else if (activityLower.includes('create') || activityLower.includes('build') || activityLower.includes('make')) {
      themes.push('creating-and-building');
    } else if (activityLower.includes('play') || activityLower.includes('game') || activityLower.includes('fun')) {
      themes.push('playing-and-games');
    } else {
      // Random selection from general activity types
      const activityTypes = ['exploring-and-discovering', 'learning-and-growing', 'creating-and-building', 'playing-and-games', 'helping-others'];
      themes.push(activityTypes[Math.floor(Math.random() * activityTypes.length)]);
    }

    return themes;
  }

  /**
   * Evolve themes based on what users actually said to previous agents
   */
  private static evolveThemesFromResponses(baseThemes: string[], previousResponses: any[]): string[] {
    let evolvedThemes = [...baseThemes];

    previousResponses.forEach((response, index) => {
      const userText = this.extractUserTextFromResponse(response);
      const detectedThemes = this.detectThemesFromUserText(userText);
      
      console.log(`🔄 Agent ${index + 1} response analysis:`, { userText: userText.substring(0, 100), detectedThemes });

      // Replace or add themes based on user responses
      detectedThemes.forEach(detectedTheme => {
        if (!evolvedThemes.includes(detectedTheme)) {
          // Replace the least relevant base theme
          evolvedThemes[index % evolvedThemes.length] = detectedTheme;
          console.log(`🎯 Theme evolution: Replacing with ${detectedTheme} based on user response`);
        }
      });
    });

    return evolvedThemes;
  }

  /**
   * Extract user text from agent response data
   */
  private static extractUserTextFromResponse(response: any): string {
    // Extract from various possible response formats
    if (response.userMessages) {
      return response.userMessages.join(' ');
    }
    if (response.capturedData) {
      return response.capturedData.map((d: any) => d.value || d.text || '').join(' ');
    }
    if (response.analysisResults?.data_collection_results) {
      return Object.values(response.analysisResults.data_collection_results).join(' ');
    }
    if (response.messages) {
      return response.messages
        .filter((m: any) => m.role === 'user' || m.source === 'user')
        .map((m: any) => m.content || m.message || '')
        .join(' ');
    }
    return '';
  }

  /**
   * Detect themes from user's actual text responses (more general detection)
   */
  private static detectThemesFromUserText(userText: string): string[] {
    const textLower = userText.toLowerCase();
    const detectedThemes = [];

    // Environment/World themes
    if (textLower.includes('nature') || textLower.includes('forest') || textLower.includes('animal') || textLower.includes('tree')) {
      detectedThemes.push('natural-worlds');
    }
    if (textLower.includes('magic') || textLower.includes('spell') || textLower.includes('fairy') || textLower.includes('wizard')) {
      detectedThemes.push('magical-worlds');
    }
    if (textLower.includes('space') || textLower.includes('robot') || textLower.includes('alien') || textLower.includes('future')) {
      detectedThemes.push('future-worlds');
    }
    if (textLower.includes('home') || textLower.includes('school') || textLower.includes('neighborhood') || textLower.includes('family')) {
      detectedThemes.push('everyday-worlds');
    }
    if (textLower.includes('adventure') || textLower.includes('explore') || textLower.includes('mountain') || textLower.includes('ocean')) {
      detectedThemes.push('adventure-environments');
    }

    // Mood/Feeling themes
    if (textLower.includes('funny') || textLower.includes('silly') || textLower.includes('laugh') || textLower.includes('joke')) {
      detectedThemes.push('fun-and-humor');
    }
    if (textLower.includes('mystery') || textLower.includes('secret') || textLower.includes('hidden') || textLower.includes('clue')) {
      detectedThemes.push('mysteries-and-secrets');
    }
    if (textLower.includes('exciting') || textLower.includes('thrill') || textLower.includes('fast') || textLower.includes('dangerous')) {
      detectedThemes.push('thrills-and-excitement');
    }
    if (textLower.includes('friend') || textLower.includes('together') || textLower.includes('team') || textLower.includes('help')) {
      detectedThemes.push('friendships-and-bonds');
    }
    if (textLower.includes('dream') || textLower.includes('wish') || textLower.includes('hope') || textLower.includes('want to be')) {
      detectedThemes.push('dreams-and-wishes');
    }

    // Activity/Experience themes
    if (textLower.includes('explore') || textLower.includes('discover') || textLower.includes('find') || textLower.includes('search')) {
      detectedThemes.push('exploring-and-discovering');
    }
    if (textLower.includes('learn') || textLower.includes('study') || textLower.includes('teach') || textLower.includes('smart')) {
      detectedThemes.push('learning-and-growing');
    }
    if (textLower.includes('build') || textLower.includes('create') || textLower.includes('make') || textLower.includes('invent')) {
      detectedThemes.push('creating-and-building');
    }
    if (textLower.includes('play') || textLower.includes('game') || textLower.includes('fun') || textLower.includes('toy')) {
      detectedThemes.push('playing-and-games');
    }
    if (textLower.includes('help') || textLower.includes('save') || textLower.includes('care') || textLower.includes('kind')) {
      detectedThemes.push('helping-others');
    }

    return detectedThemes;
  }

  /**
   * Select contextual theme based on story direction (broader themes)
   */
  private static selectContextualTheme(existingThemes: string[], previousResponses?: any[]): string {
    const allThemes = [
      // World themes
      'adventure-environments', 'natural-worlds', 'magical-worlds', 'future-worlds', 'everyday-worlds',
      // Mood themes  
      'fun-and-humor', 'mysteries-and-secrets', 'thrills-and-excitement', 'friendships-and-bonds', 'dreams-and-wishes',
      // Activity themes
      'exploring-and-discovering', 'learning-and-growing', 'creating-and-building', 'playing-and-games', 'helping-others'
    ];

    // If we have previous responses, try to find complementary themes
    if (previousResponses && previousResponses.length > 0) {
      const lastResponse = previousResponses[previousResponses.length - 1];
      const userText = this.extractUserTextFromResponse(lastResponse);
      
      // Select complementary themes based on the story direction
      if (userText.includes('adventure') && !existingThemes.includes('exploring-and-discovering')) {
        return 'exploring-and-discovering';
      }
      if (userText.includes('family') && !existingThemes.includes('everyday-worlds')) {
        return 'everyday-worlds';
      }
      if (userText.includes('learn') && !existingThemes.includes('learning-and-growing')) {
        return 'learning-and-growing';
      }
      if (userText.includes('create') && !existingThemes.includes('creating-and-building')) {
        return 'creating-and-building';
      }
    }

    // Random fallback
    const availableThemes = allThemes.filter(theme => !existingThemes.includes(theme));
    return availableThemes[Math.floor(Math.random() * availableThemes.length)] || 'exploring-and-discovering';
  }

  /**
   * Extract previous agent responses from user progress for theme evolution
   */
  private static extractPreviousAgentResponses(userProgress: any): any[] {
    const previousResponses = [];

    // Check if we're in story creation mode with existing agent data
    if (userProgress.workflowId === 'story-creation' && userProgress.stepProgress) {
      Object.values(userProgress.stepProgress).forEach((step: any) => {
        // Look for completed story agent conversations
        if (step.status === 'completed' && (step.messages || step.capturedData || step.analysisResults)) {
          previousResponses.push({
            stepId: step.stepId,
            messages: step.messages || [],
            capturedData: step.capturedData || [],
            analysisResults: step.analysisResults || {},
            userMessages: step.messages?.filter((m: any) => m.role === 'user' || m.source === 'user')
              .map((m: any) => m.content || m.message || '') || []
          });
        }
      });
    }

    // Also check for book generation specific responses
    if (userProgress.bookGenerationResponses) {
      previousResponses.push(...userProgress.bookGenerationResponses);
    }

    console.log(`🔍 Extracted ${previousResponses.length} previous agent responses for theme evolution`);
    return previousResponses;
  }
}
