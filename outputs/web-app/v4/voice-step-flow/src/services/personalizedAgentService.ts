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

    console.log('🔍 DEBUG: Full progress object:', progress);
    console.log('🔍 DEBUG: stepProgress:', progress.stepProgress);

    // Extract data from completed steps
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
        }
      }
      
      // Fallback: Extract from capturedData (less structured)
      if (step.capturedData) {
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
              
            case 'character_name':
              if (!personalization.characterName) {
                personalization.characterName = data.value;
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
    
    // Common patterns for name extraction
    const namePatterns = [
      /^([A-Za-z\s]+),/,  // "Name, age, hobby"
      /^([A-Za-z\s]+)\s+\d+/,  // "Name 14 hobby"
      /^([A-Za-z\s]+)$/,  // Just "Name"
    ];
    
    for (const pattern of namePatterns) {
      const match = personalInfo.match(pattern);
      if (match && match[1] && !personalization.userName) {
        personalization.userName = match[1].trim();
        break;
      }
    }
    
    // Extract age if present
    const ageMatch = personalInfo.match(/\b(\d+)\b/);
    if (ageMatch && !personalization.age) {
      const age = parseInt(ageMatch[1]);
      if (age > 0 && age < 150) { // Reasonable age range
        personalization.age = age;
      }
    }
  }

  /**
   * Extract data from conversation messages as fallback
   */
  private static extractFromMessages(messages: any[], personalization: UserPersonalizationData) {
    // Look for user messages that might contain names or preferences
    messages.forEach((message, index) => {
      if (message.role === 'user' && message.content) {
        // Simple patterns for name detection
        if (!personalization.userName) {
          const nameMatch = message.content.match(/^([A-Za-z\s]+)(?:\s*,|\s*\.|$)/);
          if (nameMatch && nameMatch[1].length > 1 && nameMatch[1].length < 50) {
            personalization.userName = nameMatch[1].trim();
          }
        }
        
        // Pattern for story preferences
        if (!personalization.storyPreferences && message.content.toLowerCase().includes('story')) {
          personalization.storyPreferences = [message.content];
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
    
    // Only create dynamic agents if we have user personalization data
    if (!userPersonalization) {
      console.log('❌ No personalization data available');
      return false;
    }
    
    // Create dynamic agents for these steps if user has preferences
    const dynamicSteps = ['story-preferences', 'character-details']; // Updated to match new step IDs
    const hasUserData = userPersonalization.userName || 
                       userPersonalization.storyPreferences?.length || 
                       userPersonalization.characterName;
    
    const result = dynamicSteps.includes(stepId) && Boolean(hasUserData);
    console.log(`✅ Dynamic agent decision: ${result}`);
    return result;
  }
}
