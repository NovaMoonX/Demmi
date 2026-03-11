import type { MealCategory } from '@lib/meals';
import type { IngredientType, MeasurementUnit } from '@lib/ingredients';

/**
 * Lifecycle of an agent action through the 3-step approval flow:
 *
 *  pending_confirmation → user confirms intent (Yes/No)
 *       ↓ Yes
 *   searching           → system searches existing data for similar items
 *       ↓
 *  similar_found        → similar item found; operation cancelled (terminal)
 *  pending_approval     → no similar found; user reviews & saves (or declines)
 *       ↓
 *  approved / rejected  → terminal states
 */
export type AgentActionStatus =
  | 'pending_confirmation'
  | 'searching'
  | 'similar_found'
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

export interface SimilarMealResult {
  proposedTitle: string;
  existingId: string;
  existingTitle: string;
  similarity: number; // 0–1 score
}

export interface AgentCreateMealAction {
  type: 'create_meal';
  status: AgentActionStatus;
  meals: AgentMealProposal[];
  similarMeals: SimilarMealResult[];
}

export type AgentAction = AgentCreateMealAction;
