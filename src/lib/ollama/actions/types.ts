import type { ChatMessage } from '@lib/chat';
import type { AppDispatch } from '@store/index';

export type ActionType = 'general' | 'createMeal';

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

export interface StepResult<Name extends string> {
  stepName: Name;
  data: unknown;
  error?: string;
  cancelled?: boolean;
}

export interface ActionStep<Name extends string> {
  name: Name;
  prompt: string;
  schema: Record<string, unknown>;
  isStreaming?: boolean;
  execute: (
    model: string,
    context: StepContext,
    runtime: StepRuntime,
  ) => Promise<StepResult<Name> | AsyncIterableIterator<StepResult<Name>>>;
  onCancel?: (context: StepContext, runtime: StepRuntime) => void;
}

export interface ActionHandlerBase {
  type: ActionType;
  description: string;

  onStart?: (context: StepContext, runtime: StepRuntime) => void;
  onComplete?: (context: StepContext, runtime: StepRuntime) => void;
  onCancel?: (
    context: StepContext,
    runtime: StepRuntime,
    completedSteps: string[],
  ) => void;
}

export interface SingleStepActionHandler extends ActionHandlerBase {
  isMultiStep: false;

  execute: (
    model: string,
    context: StepContext,
    runtime: StepRuntime,
  ) => Promise<ActionResult | AsyncIterableIterator<ActionResult>>;

  steps?: never;
}

// This type ensures that if `isMultiStep` is true and steps are provided
// then `ValidStepNames` must be provided to the action handler,
// where `ValidStepNames` is a union of string literals representing 
// the valid step names for that handler.
type RequireStepNames<T extends string> = [T] extends [never]
  ? 'MultiStepActionHandler requires ValidStepNames'
  : T;

export interface MultiStepActionHandler<
  ValidStepNames extends string,
> extends ActionHandlerBase {
  isMultiStep: true;

  execute?: never;

  steps: ActionStep<RequireStepNames<ValidStepNames>>[];
}

export type ActionHandler<ValidStepNames extends string = never> =
  | SingleStepActionHandler
  // `ValidStepNames` should always be provided for multi-step handlers
  | MultiStepActionHandler<ValidStepNames>;

export interface ActionResult {
  type: ActionType;
  data: unknown;
  error?: string;
}
