export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink';

export interface Meal {
  id: string;
  title: string;
  description: string;
  category: MealCategory;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servingSize: number;
  instructions: string[];
  imageUrl: string;
}
