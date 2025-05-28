
export type StepState = 'not_started' | 'in_progress' | 'started' | 'complete' | 'error';

export interface Step {
  id: string;
  title: string;
  sectionId: string;
  agentId: string;
}

// Extended step interface with state for UI rendering
export interface StepWithState extends Step {
  state: StepState;
}

export interface Section {
  id: string;
  title: string;
  steps: Step[];
}

// Extended section interface with state-enabled steps for UI rendering
export interface SectionWithState {
  id: string;
  title: string;
  steps: StepWithState[];
}

export interface Workflow {
  id: string;
  title: string;
  sections: Section[];
}

// Extended workflow interface with state-enabled sections for UI rendering
export interface WorkflowWithState {
  id: string;
  title: string;
  sections: SectionWithState[];
}
