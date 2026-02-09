import { MealType } from '@lib/mealPlans';
import { MealCategory } from './meals.types';

export const MEAL_CATEGORY_COLORS: Record<MealCategory, string> = {
  breakfast: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  lunch: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  dinner: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  snack: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  dessert: 'bg-pink-500/20 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
  drink: 'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
};

export const MEAL_CATEGORY_EMOJIS: Record<MealCategory, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
  snack: '🍿',
  dessert: '🍰',
  drink: '🥤',
};

export const MEAL_CATEGORY_OPTIONS: Array<{ value: MealCategory; text: string }> = [
  { value: 'breakfast', text: '🌅 Breakfast' },
  { value: 'lunch', text: '🍱 Lunch' },
  { value: 'dinner', text: '🌙 Dinner' },
  { value: 'snack', text: '🍿 Snack' },
  { value: 'dessert', text: '🍰 Dessert' },
  { value: 'drink', text: '🥤 Drink' },
];

export const MEAL_CATEGORY_FILTER_OPTIONS: Array<{ value: MealCategory | 'all'; text: string }> = [
  { value: 'all', text: 'All Categories' },
  ...MEAL_CATEGORY_OPTIONS,
];

export const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  lunch: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  dinner: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  snack: 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
};

export const MEAL_TYPE_BG_COLORS: Record<MealType, string> = {
  breakfast: 'bg-amber-500/20',
  lunch: 'bg-emerald-500/20',
  dinner: 'bg-blue-500/20',
  snack: 'bg-purple-500/20',
};

export const MEAL_TYPE_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🍱',
  dinner: '🌙',
  snack: '🍿',
};

export const MEAL_TYPE_OPTIONS: Array<{ value: MealType; text: string }> = [
  { value: 'breakfast', text: '🌅 Breakfast' },
  { value: 'lunch', text: '🍱 Lunch' },
  { value: 'dinner', text: '🌙 Dinner' },
  { value: 'snack', text: '🍿 Snack' },
];
