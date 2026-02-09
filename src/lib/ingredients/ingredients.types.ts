export type IngredientType = 
  | 'meat' 
  | 'produce' 
  | 'dairy' 
  | 'grains' 
  | 'legumes' 
  | 'oils' 
  | 'spices' 
  | 'nuts' 
  | 'seafood' 
  | 'other';

export type MeasurementUnit = 
  | 'lb' 
  | 'oz' 
  | 'kg' 
  | 'g' 
  | 'cup' 
  | 'tbsp' 
  | 'tsp' 
  | 'piece' 
  | 'can' 
  | 'bag'
  | 'bottle'
  | 'box'
  | 'jar'
  | 'pack'
  | 'slice' 
  | 'jug'
  | 'bunch'
  | 'container'
  | 'carton'
  | 'gallon'
  | 'other';

export interface NutrientProfile {
  // Macros (per 100g/100ml)
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  // Additional nutrients
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // milligrams
  calories: number; // kcal
}

export interface Ingredient {
  id: string;
  name: string;
  type: IngredientType;
  imageUrl: string;
  nutrients: NutrientProfile;
  currentAmount: number;
  unit: MeasurementUnit;
  otherUnit: string | null; // For custom units if 'other' is selected
  pricePerUnit: number; // in dollars
}
