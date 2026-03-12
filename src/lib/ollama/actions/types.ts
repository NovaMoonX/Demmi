import type { ChatMessage } from '@lib/chat';
import type { AppDispatch } from '@store';

export type ActionType = 'general' | 'createMeal' | 'addIngredient' | 'planWeek';

export interface StepContext {
  messages: ChatMessage[];
  chatId: string;
  messageId: string;
  previousResults?: Record<string, unknown>;
}

export interface StepRuntime {
  dispatch: AppDispatch;
  abortSignal?: AbortSignal;
}

export interface StepResult {
  stepName: string;
  data: unknown;
  error?: string;
  cancelled?: boolean;
}

export interface ActionStep {
  name: string;
  prompt: string;
  schema: Record<string, unknown>;
  isStreaming?: boolean;
  execute: (
    model: string,
    context: StepContext,
    runtime: StepRuntime,
  ) => Promise<StepResult | AsyncIterableIterator<StepResult>>;
  onCancel?: (context: StepContext, runtime: StepRuntime) => void;
}

export interface ActionHandler {
  type: ActionType;
  description: string;
  isMultiStep: boolean;
  execute?: (
    model: string,
    context: StepContext,
    runtime: StepRuntime,
  ) => Promise<ActionResult | AsyncIterableIterator<ActionResult>>;
  steps?: ActionStep[];
  onStart?: (context: StepContext, runtime: StepRuntime) => void;
  onComplete?: (context: StepContext, runtime: StepRuntime) => void;
  onCancel?: (context: StepContext, runtime: StepRuntime, completedSteps: string[]) => void;
}

export interface ActionResult {
  type: ActionType;
  data: unknown;
  error?: string;
}
