import type { MealCategory } from '@lib/meals';
import type { IngredientType, MeasurementUnit } from '@lib/ingredients';

export type AgentActionStatus = 'pending' | 'approved' | 'rejected';

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
  meals: AgentMealProposal[];
}

export type AgentAction = AgentCreateMealAction;
