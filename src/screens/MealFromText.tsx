import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Textarea, Button, Label } from '@moondreamsdev/dreamer-ui/components';

export function MealFromText() {
  const navigate = useNavigate();
  const [recipeText, setRecipeText] = useState('');

  const handleContinue = () => {
    navigate('/meals/new', { state: { recipeText } });
  };

  return (
    <div className='mx-auto mt-10 max-w-2xl p-6 md:mt-0'>
      <div className='mb-8'>
        <Link
          to='/meals'
          className='text-muted-foreground hover:text-foreground mb-4 inline-block text-sm'
        >
          ← Back to Meals
        </Link>
        <h1 className='text-foreground mb-2 text-4xl font-bold'>Paste Your Recipe</h1>
        <p className='text-muted-foreground'>
          Someone sent you a recipe? Paste the full text below and we'll take it from there.
        </p>
      </div>

      <div className='flex flex-col gap-6'>
        <div>
          <Label htmlFor='recipe-text'>Recipe Text</Label>
          <Textarea
            id='recipe-text'
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
            placeholder='Paste the recipe here — ingredients, instructions, all of it…'
            rows={16}
          />
        </div>

        <div className='flex gap-3'>
          <Button
            variant='primary'
            className='flex-1'
            onClick={handleContinue}
            disabled={recipeText.trim() === ''}
          >
            Continue
          </Button>
          <Button
            variant='secondary'
            className='flex-1'
            onClick={() => navigate('/meals')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MealFromText;
