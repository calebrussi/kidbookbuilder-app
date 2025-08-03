import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { useWorkflow } from '../hooks/useWorkflow';
import { PersonalizedAgentService } from '../services/personalizedAgentService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Users, BookOpen, ArrowRight, RotateCcw } from "lucide-react";

interface GeneratedAgent {
  id: string;
  agent_id?: string;
  name: string;
  description: string;
  prompt: string;
  role?: string;
  voiceId?: string;
}

const BookGenerationPage: React.FC = () => {
  console.log('📚 BookGenerationPage: Component rendering started');
  
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { workflow, loading: workflowLoading } = useWorkflow(isAuthenticated);
  const { progress, loading: progressLoading } = useProgress(workflow, workflowLoading);
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAgents, setGeneratedAgents] = useState<GeneratedAgent[]>([]);
  const [error, setError] = useState<string>('');

  // Load persisted agents on component mount
  useEffect(() => {
    const loadPersistedAgents = () => {
      if (!user) return;
      
      try {
        const agentKey = `generated_agents_${user.id}`;
        const persistedAgents = localStorage.getItem(agentKey);
        if (persistedAgents) {
          const agents = JSON.parse(persistedAgents);
          console.log('📱 Loaded persisted agents from localStorage:', agents);
          setGeneratedAgents(agents);
        }
      } catch (error) {
        console.error('❌ Failed to load persisted agents:', error);
      }
    };

    loadPersistedAgents();
  }, [user]);

  // Persist agents whenever they change
  useEffect(() => {
    if (!user || generatedAgents.length === 0) return;

    try {
      const agentKey = `generated_agents_${user.id}`;
      localStorage.setItem(agentKey, JSON.stringify(generatedAgents));
      console.log('💾 Persisted agents to localStorage:', generatedAgents.length);
    } catch (error) {
      console.error('❌ Failed to persist agents:', error);
    }
  }, [user, generatedAgents]);

  console.log('📚 BookGenerationPage: State values:', {
    hasUser: !!user,
    hasWorkflow: !!workflow,
    hasProgress: !!progress,
    workflowLoading,
    progressLoading
  });

  // Extract user personalization data
  const userPersonalization = progress ? 
    PersonalizedAgentService.extractPersonalizationFromProgress(progress) : null;

  // Check if user has completed the character quiz
  const hasCompletedQuiz = () => {
    if (!progress) {
      console.log('📚 BookGeneration: No progress data available');
      return false;
    }
    
    const requiredSteps = ['name', 'story-preferences', 'character-details'];
    const allStepsComplete = requiredSteps.every(stepId => 
      progress.stepProgress[stepId]?.status === 'complete'
    );
    const workflowComplete = progress.currentStepId === 'workflow_complete';
    
    console.log('📚 BookGeneration completion check:', {
      hasProgress: !!progress,
      allStepsComplete,
      workflowComplete,
      currentStepId: progress.currentStepId,
      stepStatuses: Object.fromEntries(
        requiredSteps.map(stepId => [stepId, progress.stepProgress[stepId]?.status])
      ),
      totalStepsInProgress: Object.keys(progress.stepProgress || {}).length
    });
    
    return allStepsComplete || workflowComplete;
  };

  // Auto-generate agents when component loads and quiz is complete
  useEffect(() => {
    const autoGenerateAgents = async () => {
      if (!user || !progress || !hasCompletedQuiz() || generatedAgents.length > 0 || isGenerating) {
        return;
      }

      console.log('🚀 Auto-generating story agents for completed quiz...');
      await handleGenerateAgents();
    };

    autoGenerateAgents();
  }, [user, progress]);

  const navigateToStoryCreation = async () => {
    if (!generatedAgents || generatedAgents.length === 0) {
      console.error('❌ No agents available for story creation');
      return;
    }

    try {
      console.log('🚀 Navigating to story creation with existing agents:', generatedAgents);
      
      // Create story workflow with existing agents
      const storyWorkflow = {
        id: 'story-creation',
        title: 'Story Creation with Your Agents',
        description: 'Create your story by talking with your personalized AI agents',
        agents: generatedAgents,
        sections: [
          {
            id: 'world-design',
            title: 'Design Your Story World',
            order: 0,
            steps: [
              {
                id: 'setting-questions',
                title: `Talk with ${generatedAgents[0]?.name || 'World Explorer'}`,
                order: 0,
                sectionId: 'world-design',
                agentId: generatedAgents[0]?.id || generatedAgents[0]?.agent_id
              }
            ]
          },
          {
            id: 'conflict-creation',
            title: 'Create Story Problems',
            order: 1,
            steps: [
              {
                id: 'conflict-questions', 
                title: `Talk with ${generatedAgents[1]?.name || 'Joy Collector'}`,
                order: 1,
                sectionId: 'conflict-creation',
                agentId: generatedAgents[1]?.id || generatedAgents[1]?.agent_id
              }
            ]
          },
          {
            id: 'character-building',
            title: 'Build Supporting Characters',
            order: 2,
            steps: [
              {
                id: 'character-questions',
                title: `Talk with ${generatedAgents[2]?.name || 'Helper Finder'}`,
                order: 2,
                sectionId: 'character-building', 
                agentId: generatedAgents[2]?.id || generatedAgents[2]?.agent_id
              }
            ]
          }
        ]
      };

      // Extract user personalization data from the completed quiz
      const userPersonalization = PersonalizedAgentService.extractPersonalizationFromProgress(progress);
      console.log('👤 User personalization for story creation:', userPersonalization);

      // Check for existing story progress
      const storyProgressKey = `story_progress_${user?.id}`;
      let existingProgress = null;
      
      try {
        const storedProgress = localStorage.getItem(storyProgressKey);
        if (storedProgress) {
          existingProgress = JSON.parse(storedProgress);
          console.log('📱 Found existing story progress:', existingProgress);
        }
      } catch (error) {
        console.error('❌ Failed to load existing story progress:', error);
      }

      // Create initial story progress if none exists
      if (!existingProgress) {
        const initialStoryProgress = {
          workflowId: 'story-creation',
          sessionId: `story_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          currentStepId: 'setting-questions',
          stepProgress: {
            'setting-questions': {
              stepId: 'setting-questions',
              status: 'in_progress',
              conversationId: `conv_setting_${Date.now()}`,
              lastModified: new Date().toISOString(),
              attemptCount: 0,
              messages: [],
              capturedData: [],
              analysisResults: null,
              success: false,
              conversationStatus: 'not_started'
            },
            'conflict-questions': {
              stepId: 'conflict-questions',
              status: 'not_started',
              conversationId: `conv_conflict_${Date.now()}`,
              lastModified: new Date().toISOString(),
              attemptCount: 0,
              messages: [],
              capturedData: [],
              analysisResults: null,
              success: false,
              conversationStatus: 'not_started'
            },
            'character-questions': {
              stepId: 'character-questions',
              status: 'not_started',
              conversationId: `conv_character_${Date.now()}`,
              lastModified: new Date().toISOString(),
              attemptCount: 0,
              messages: [],
              capturedData: [],
              analysisResults: null,
              success: false,
              conversationStatus: 'not_started'
            }
          },
          overallProgress: {
            completedSteps: 0,
            totalSteps: 3,
            percentComplete: 0,
            lastUpdated: new Date().toISOString()
          },
          characterQuizData: userPersonalization // Include character data from quiz
        };

        // Store the initial progress
        localStorage.setItem(storyProgressKey, JSON.stringify(initialStoryProgress));
        console.log('💾 Created initial story progress');
      }

      // Store the story workflow
      localStorage.setItem('storyWorkflow', JSON.stringify(storyWorkflow));
      console.log('💾 Stored story workflow for navigation');

      // Navigate to main app with story creation mode
      navigate('/?mode=story-creation');
      
    } catch (error) {
      console.error('❌ Failed to navigate to story creation:', error);
      setError('Failed to start story creation. Please try again.');
    }
  };

  const clearGeneratedAgents = () => {
    if (!user) return;
    
    try {
      const agentKey = `generated_agents_${user.id}`;
      localStorage.removeItem(agentKey);
      setGeneratedAgents([]);
      console.log('🧹 Cleared generated agents');
    } catch (error) {
      console.error('❌ Failed to clear agents:', error);
    }
  };

  const handleGenerateAgents = async () => {
    if (!user || !progress) {
      setError('Missing user data or progress information');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('🚀 Starting book agent generation...');
      
      const agents = await PersonalizedAgentService.generateBookAgents(
        user.id,
        progress
      );

      console.log('✅ Generated agents:', agents);
      setGeneratedAgents(agents);
      
    } catch (err) {
      console.error('❌ Failed to generate book agents:', err);
      setError('Failed to generate story agents. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateAgents = () => {
    setGeneratedAgents([]);
    setError('');
    handleGenerateAgents();
  };

  const handleStartStoryCreation = async () => {
    if (!generatedAgents || generatedAgents.length === 0) {
      console.error('No agents available to start story creation');
      return;
    }

    try {
      // Create a new workflow session for story creation using the generated agents
      const storyWorkflow = {
        id: 'story-creation',
        title: 'Story Creation with Your Agents',
        description: 'Create your story by talking with your personalized AI agents',
        agents: generatedAgents,
        sections: [
          {
            id: 'setting-design',
            title: 'Design Your Story World',
            order: 0,
            steps: [
              {
                id: 'setting-questions',
                title: `Talk with ${generatedAgents[0]?.name || 'Setting Builder'}`,
                order: 0,
                sectionId: 'setting-design',
                agentId: generatedAgents[0]?.id || generatedAgents[0]?.agent_id
              }
            ]
          },
          {
            id: 'conflict-creation',
            title: 'Create Story Problems',
            order: 1,
            steps: [
              {
                id: 'conflict-questions', 
                title: `Talk with ${generatedAgents[1]?.name || 'Problem Creator'}`,
                order: 1,
                sectionId: 'conflict-creation',
                agentId: generatedAgents[1]?.id || generatedAgents[1]?.agent_id
              }
            ]
          },
          {
            id: 'character-building',
            title: 'Build Supporting Characters',
            order: 2,
            steps: [
              {
                id: 'character-questions',
                title: `Talk with ${generatedAgents[2]?.name || 'Character Builder'}`,
                order: 2,
                sectionId: 'character-building', 
                agentId: generatedAgents[2]?.id || generatedAgents[2]?.agent_id
              }
            ]
          }
        ]
      };

      // Store the story workflow and navigate to it
      console.log('🚀 Starting story creation with workflow:', storyWorkflow);
      
      // Create initial progress for story creation with character data from quiz
      const storyProgress = {
        workflowId: 'story-creation',
        sessionId: `story_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        currentStepId: 'setting-questions',
        stepProgress: {
          'setting-questions': {
            stepId: 'setting-questions',
            status: 'in_progress',
            conversationId: `conv_setting_${Date.now()}`,
            lastModified: new Date().toISOString(),
            attemptCount: 0,
            messages: [],
            capturedData: [],
            analysisResults: null,
            success: false,
            conversationStatus: 'not_started'
          },
          'conflict-questions': {
            stepId: 'conflict-questions', 
            status: 'not_started',
            conversationId: `conv_conflict_${Date.now()}`,
            lastModified: new Date().toISOString(),
            attemptCount: 0,
            messages: [],
            capturedData: [],
            analysisResults: null,
            success: false,
            conversationStatus: 'not_started'
          },
          'character-questions': {
            stepId: 'character-questions',
            status: 'not_started', 
            conversationId: `conv_character_${Date.now()}`,
            lastModified: new Date().toISOString(),
            attemptCount: 0,
            messages: [],
            capturedData: [],
            analysisResults: null,
            success: false,
            conversationStatus: 'not_started'
          }
        },
        overallProgress: {
          currentStepIndex: 0,
          totalSteps: 3,
          completedSteps: 0,
          lastUpdated: new Date().toISOString()
        },
        // Include character quiz data for personalization
        characterQuizData: userPersonalization
      };
      
      // Store in localStorage so the main app can pick it up
      localStorage.setItem('activeStoryWorkflow', JSON.stringify(storyWorkflow));
      localStorage.setItem('storyCreationProgress', JSON.stringify(storyProgress));
      localStorage.setItem('storyCreationMode', 'true');
      
      // Create initial progress for the story creation workflow
      const initialProgress = {
        workflowId: 'story-creation',
        sessionId: `story_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        currentStepId: 'setting-questions', // Start with the first step
        stepProgress: {
          'setting-questions': {
            stepId: 'setting-questions',
            status: 'in_progress',
            conversationId: `conv_setting_${Date.now()}`,
            lastModified: new Date(),
            attemptCount: 0,
            messages: [],
            success: false,
            conversationStatus: 'not_started'
          },
          'conflict-questions': {
            stepId: 'conflict-questions',
            status: 'not_started',
            conversationId: `conv_conflict_${Date.now()}`,
            lastModified: new Date(),
            attemptCount: 0,
            messages: [],
            success: false,
            conversationStatus: 'not_started'
          },
          'character-questions': {
            stepId: 'character-questions',
            status: 'not_started',
            conversationId: `conv_character_${Date.now()}`,
            lastModified: new Date(),
            attemptCount: 0,
            messages: [],
            success: false,
            conversationStatus: 'not_started'
          }
        },
        overallProgress: {
          totalSteps: 3,
          completedSteps: 0,
          percentComplete: 0
        },
        sessionData: {
          startedAt: new Date(),
          lastActivityAt: new Date(),
          timeSpentMinutes: 0
        }
      };
      
      // Store initial progress for story creation
      localStorage.setItem('storyCreationProgress', JSON.stringify(initialProgress));
      
      // Navigate to the main workflow interface
      navigate('/');
      
    } catch (error) {
      console.error('Failed to start story creation:', error);
    }
  };

  // Show loading while progress is loading
  if (workflowLoading || progressLoading || !progress || !workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-purple-600 font-medium">
            {workflowLoading ? 'Loading workflow...' : progressLoading ? 'Loading your progress...' : 'Initializing...'}
          </p>
        </div>
      </div>
    );
  }

  if (!hasCompletedQuiz()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Complete Your Character Quiz First!</h1>
              <p className="text-gray-600 mb-6">
                You need to complete the character creation quiz before you can generate your story agents.
              </p>
              <Link to="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Character Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Generate Your Story Agents ✨
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Let's create personalized AI agents for your {userPersonalization?.userName || 'amazing'} story!
            </p>
          </div>
        </div>

        {/* User Personalization Summary */}
        {userPersonalization && hasCompletedQuiz() && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Story Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Age</label>
                  <p className="text-lg font-semibold">{userPersonalization.age || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Character</label>
                  <p className="text-lg font-semibold">{userPersonalization.characterName || 'Hero'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Story Preferences</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {userPersonalization.storyPreferences?.length ? 
                      userPersonalization.storyPreferences.map((pref: string, index: number) => (
                        <Badge key={index} variant="secondary">{pref}</Badge>
                      )) :
                      <span className="text-gray-400 text-sm">Not specified</span>
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Status Section */}
        {hasCompletedQuiz() && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {generatedAgents.length > 0 
                  ? 'Your Story Agents Are Ready!' 
                  : isGenerating 
                    ? 'Generating Your Story Agents' 
                    : 'Story Agent Generation'
                }
              </CardTitle>
              <CardDescription>
                {generatedAgents.length > 0 
                  ? 'Your personalized AI agents are ready to help create your story!'
                  : isGenerating 
                    ? 'Creating personalized AI agents based on your preferences...'
                    : 'Your personalized story agents will be created automatically!'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-purple-600">Creating your agents...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This may take a few moments as we personalize each agent for your story.
                  </p>
                </div>
              ) : generatedAgents.length > 0 ? (
                <div className="space-y-4">
                  {/* Show agent preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generatedAgents.map((agent, index) => (
                      <div key={agent.id || agent.agent_id} className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                        <h4 className="font-semibold text-purple-700">{agent.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      onClick={navigateToStoryCreation}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Start Creating Your Story
                    </Button>
                    <Button
                      onClick={clearGeneratedAgents}
                      variant="outline"
                      size="lg"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Generate New Agents
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">Ready to generate agents!</p>
                  <Button
                    onClick={() => handleGenerateAgents()}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mt-4"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Story Agents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookGenerationPage;
