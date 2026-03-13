import { generalAction } from './generalAction';
import type { ActionType, StepContext, StepRuntime, ActionResult, ActionStep } from './types';

type RegistryActionHandler = {
  type: ActionType;
  description: string;
  isMultiStep: boolean;
  execute?: (
    model: string,
    context: StepContext<Record<string, unknown>>,
    runtime: StepRuntime,
  ) => Promise<ActionResult<Record<string, unknown>>>;
  onStart?: (context: StepContext<Record<string, unknown>>, runtime: StepRuntime) => void;
  steps?: ActionStep<Record<string, unknown>, string>[];
  onCancel?: (
    context: StepContext<Record<string, unknown>>,
    runtime: StepRuntime,
    completedSteps?: string[],
  ) => void;
};

// Placeholder for createMeal action — to be implemented as a multi-step handler in Phase 3.
const createMealPlaceholder: RegistryActionHandler = {
  type: 'createMeal',
  description: 'Create meal action (multi-step, coming in Phase 3)',
  isMultiStep: true,
  steps: [],
};

const ACTION_REGISTRY: Record<ActionType, RegistryActionHandler> = {
  general: generalAction,
  createMeal: createMealPlaceholder,
};

export function getActionHandler(actionType: ActionType): RegistryActionHandler {
  const handler = ACTION_REGISTRY[actionType];
  if (!handler) {
    throw new Error(`Unknown action type: ${actionType}`);
  }
  return handler;
}
