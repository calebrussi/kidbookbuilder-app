export interface Step {
  id: string;
  title: string;
  description: string;
  state: 'not_started' | 'in_progress' | 'started' | 'complete' | 'error';
}

export interface Group {
  id: string;
  name: string;
  theme: string;
  description: string;
  steps: Step[];
}

export interface Workflow {
  workflowName: string;
  groups: Group[];
}

export interface Position {
  x: number;
  y: number;
}

export interface AvatarProps {
  currentPosition: Position;
  targetPosition: Position;
  isMoving: boolean;
  onMoveComplete: () => void;
}

export interface CompanionProps {
  position: Position;
  currentAreaDescription?: string;
  isExplaining: boolean;
  onExplainComplete: () => void;
}

export interface QuestStepProps {
  step: Step;
  position: Position;
  onClick: () => void;
  isActive: boolean;
}

export interface AreaProps {
  group: Group;
  position: Position;
  isActive: boolean;
  isCompleted: boolean;
  onStepClick: (stepId: string) => void;
  activeStepId: string | null;
}