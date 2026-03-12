import type { MealCategory } from '@lib/meals';
import type { IngredientType, MeasurementUnit } from '@lib/ingredients';

/**
 * Lifecycle of an agent action through the 2-phase approval flow:
 *
 *  pending_confirmation → user confirms intent (Yes/No)
 *       ↓ Yes
 *   generating          → Phase 2 AI call generating the recipe
 *       ↓
 *  pending_approval     → recipe ready; user reviews & saves (or declines)
 *       ↓
 *  approved / rejected  → terminal states
 */
export type AgentActionStatus =
  | 'pending_confirmation'
  | 'generating'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export interface AgentIngredientProposal {
  name: string;
  type: IngredientType;
  unit: MeasurementUnit;
  servings: number;
}

export interface AgentMealProposal {
  title: string;
  description: string;
  category: MealCategory;
  prepTime: number;
  cookTime: number;
  servingSize: number;
  instructions: string[];
  imageUrl: string;
  ingredients: AgentIngredientProposal[];
}

export interface AgentCreateMealAction {
  type: 'create_meal';
  status: AgentActionStatus;
  proposedName: string;
  meals: AgentMealProposal[];
}

export type AgentAction = AgentCreateMealAction;
