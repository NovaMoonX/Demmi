import { useState } from 'react';
import { Ingredient, mockIngredients } from '@lib/ingredients';

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    mockIngredients.map((ing) => ({ ...ing, otherUnit: null }))
  );

  const createIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: `ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    
    return newIngredient;
  };

  const updateIngredient = (id: string, updates: Partial<Omit<Ingredient, 'id'>>) => {
    const updatedIngredients = ingredients.map((ingredient) => 
      ingredient.id === id ? { ...ingredient, ...updates } : ingredient
    );
    
    setIngredients(updatedIngredients);
    
    return updatedIngredients.find((ingredient) => ingredient.id === id);
  };

  const deleteIngredient = (id: string) => {
    const updatedIngredients = ingredients.filter((ingredient) => ingredient.id !== id);
    setIngredients(updatedIngredients);
  };

  return {
    ingredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
  };
}
