import { useState } from 'react';
import { Meal, mockMeals } from '@lib/meals';

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>(mockMeals);

  const createMeal = (meal: Omit<Meal, 'id'>) => {
    const newMeal: Meal = {
      ...meal,
      id: `meal-${Date.now()}`,
    };
    
    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    
    return newMeal;
  };

  const updateMeal = (id: string, updates: Partial<Omit<Meal, 'id'>>) => {
    const updatedMeals = meals.map((meal) => 
      meal.id === id ? { ...meal, ...updates } : meal
    );
    
    setMeals(updatedMeals);
    
    return updatedMeals.find((meal) => meal.id === id);
  };

  const deleteMeal = (id: string) => {
    const updatedMeals = meals.filter((meal) => meal.id !== id);
    setMeals(updatedMeals);
  };

  return {
    meals,
    createMeal,
    updateMeal,
    deleteMeal,
  };
}
