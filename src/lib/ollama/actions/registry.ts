import { generalAction } from './generalAction';
import type { ActionHandler, ActionType } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ACTION_REGISTRY: Partial<Record<ActionType, ActionHandler<any>>> = {
  general: generalAction,
  // Future: createMeal, addIngredient, planWeek, etc.
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getActionHandler(actionType: ActionType): ActionHandler<any> {
  const handler = ACTION_REGISTRY[actionType];
  if (!handler) {
    throw new Error(`Unknown action type: ${actionType}`);
  }
  return handler;
}
