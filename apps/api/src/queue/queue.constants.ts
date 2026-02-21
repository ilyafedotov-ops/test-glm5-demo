// Queue names
export const QUEUE_NAMES = {
  REPORTS: "reports",
  NOTIFICATIONS: "notifications",
  WORKFLOWS: "workflows",
  AUDIT: "audit",
  EMAIL: "email",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job types
export interface ReportJobData {
  jobId: string;
  type: string;
  format: string;
  organizationId: string;
  parameters: Record<string, any>;
}

export interface NotificationJobData {
  notificationId: string;
  userId: string;
  type: string;
  channels: string[];
  data: Record<string, any>;
}

export interface WorkflowJobData {
  workflowId: string;
  stepId: string;
  action: string;
  organizationId: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Job options
export const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
} as const;
