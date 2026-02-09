import { useState } from 'react';
import { MealPlan } from '@lib/mealPlans';

export function useMealPlans() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

  const createMealPlan = (mealPlan: Omit<MealPlan, 'id'>) => {
    const newMealPlan: MealPlan = {
      ...mealPlan,
      id: `mealplan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedMealPlans = [...mealPlans, newMealPlan];
    setMealPlans(updatedMealPlans);

    return newMealPlan;
  };

  const updateMealPlan = (id: string, updates: Partial<Omit<MealPlan, 'id'>>) => {
    const updatedMealPlans = mealPlans.map((plan) =>
      plan.id === id ? { ...plan, ...updates } : plan
    );

    setMealPlans(updatedMealPlans);

    const result = updatedMealPlans.find((plan) => plan.id === id);
    return result;
  };

  const deleteMealPlan = (id: string) => {
    const updatedMealPlans = mealPlans.filter((plan) => plan.id !== id);
    setMealPlans(updatedMealPlans);
  };

  const getMealPlansForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = mealPlans.filter(
      (plan) => plan.date >= startOfDay.getTime() && plan.date <= endOfDay.getTime()
    );

    return result;
  };

  return {
    mealPlans,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    getMealPlansForDate,
  };
}
