
export interface WorkflowStep {
  id: string;
  title: string;
  order: number;
  sectionId: string;
  agentId: string;
}

export interface WorkflowSection {
  id: string;
  title: string;
  order: number;
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  title: string;
  description?: string;
  sections: WorkflowSection[];
  createdAt: Date;
  updatedAt: Date;
}
