import { IngredientType } from './ingredients.types';

export const INGREDIENT_TYPE_COLORS: Record<IngredientType, string> = {
  meat: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  produce:
    'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  dairy: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  grains:
    'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  legumes:
    'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  oils: 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  spices:
    'bg-orange-500/20 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  nuts: 'bg-stone-500/20 text-stone-700 dark:bg-stone-500/10 dark:text-stone-400',
  seafood:
    'bg-cyan-500/20 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  other: 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
};

export const INGREDIENT_TYPE_EMOJIS: Record<IngredientType, string> = {
  meat: '🥩',
  produce: '🥬',
  dairy: '🥛',
  grains: '🌾',
  legumes: '🫘',
  oils: '🫒',
  spices: '🧂',
  nuts: '🥜',
  seafood: '🐟',
  other: '📦',
};