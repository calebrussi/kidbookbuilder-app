import { UserProgress } from "../types/userProgress";

// This utility helps upgrade or fix existing progress data
export const fixProgressData = (progress: UserProgress): UserProgress => {
  // Create a copy to avoid mutating the original
  const fixedProgress = { ...progress };
  
  // Check each step and ensure success and conversationStatus are defined
  Object.keys(fixedProgress.stepProgress).forEach((stepId) => {
    if (fixedProgress.stepProgress[stepId].success === undefined) {
      fixedProgress.stepProgress[stepId].success = false;
    }
    
    if (fixedProgress.stepProgress[stepId].conversationStatus === undefined) {
      fixedProgress.stepProgress[stepId].conversationStatus = 'not_started';
    }
  });
  
  return fixedProgress;
};
