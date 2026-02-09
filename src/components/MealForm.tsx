import { useState } from 'react';
import { Input, Textarea, Select, Button } from '@moondreamsdev/dreamer-ui/components';
import { Meal, MealCategory } from '@lib/meals';

interface MealFormProps {
  meal?: Meal;
  onSubmit: (meal: Omit<Meal, 'id'>) => void;
  onCancel: () => void;
}

export function MealForm({ meal, onSubmit, onCancel }: MealFormProps) {
  const [title, setTitle] = useState(meal?.title || '');
  const [description, setDescription] = useState(meal?.description || '');
  const [category, setCategory] = useState<string>(meal?.category || 'breakfast');
  const [prepTime, setPrepTime] = useState(meal?.prepTime.toString() || '0');
  const [cookTime, setCookTime] = useState(meal?.cookTime.toString() || '0');
  const [servingSize, setServingSize] = useState(meal?.servingSize.toString() || '1');
  const [imageUrl, setImageUrl] = useState(meal?.imageUrl || '');
  const [instructions, setInstructions] = useState(meal?.instructions.join('\n') || '');

  const categoryOptions = [
    { value: 'breakfast', text: '🌅 Breakfast' },
    { value: 'lunch', text: '🍱 Lunch' },
    { value: 'dinner', text: '🌙 Dinner' },
    { value: 'snack', text: '🍿 Snack' },
    { value: 'dessert', text: '🍰 Dessert' },
    { value: 'drink', text: '🥤 Drink' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const instructionsList = instructions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const mealData: Omit<Meal, 'id'> = {
      title,
      description,
      category: category as MealCategory,
      prepTime: parseInt(prepTime, 10) || 0,
      cookTime: parseInt(cookTime, 10) || 0,
      servingSize: parseInt(servingSize, 10) || 1,
      imageUrl,
      instructions: instructionsList,
    };

    onSubmit(mealData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
          Title *
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter meal title"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
          Description *
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter meal description"
          required
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
          Category *
        </label>
        <Select
          options={categoryOptions}
          value={category}
          onChange={(value) => setCategory(value)}
          placeholder="Select category"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="prepTime" className="block text-sm font-medium text-foreground mb-1">
            Prep Time (min) *
          </label>
          <Input
            id="prepTime"
            type="number"
            min="0"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="cookTime" className="block text-sm font-medium text-foreground mb-1">
            Cook Time (min) *
          </label>
          <Input
            id="cookTime"
            type="number"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="servingSize" className="block text-sm font-medium text-foreground mb-1">
            Servings *
          </label>
          <Input
            id="servingSize"
            type="number"
            min="1"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-foreground mb-1">
          Image URL
        </label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-foreground mb-1">
          Instructions (one per line) *
        </label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter each instruction on a new line"
          required
          rows={6}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {meal ? 'Update Meal' : 'Create Meal'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
