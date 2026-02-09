export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  date: number; // millisecond timestamp (Unix ms)
  mealType: MealType;
  mealId: string; // reference to a Meal
  time: string | null; // time in HH:MM format (e.g., "08:00", "12:30")
  notes: string | null;
}
