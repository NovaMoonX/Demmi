import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Badge, Button } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { fetchSharedMeal } from '@store/actions/shareMealActions';
import { SharedMeal } from '@lib/meals/sharedMeal.types';
import { MEAL_CATEGORY_COLORS, MEAL_CATEGORY_EMOJIS } from '@lib/meals';
import { useAppDispatch } from '@store/hooks';

export function SharedMealView() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [meal, setMeal] = useState<SharedMeal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareId) {
      navigate('/');
      return;
    }

    dispatch(fetchSharedMeal(shareId))
      .unwrap()
      .then((result) => {
        if (!result) {
          navigate('/');
        } else {
          setMeal(result);
        }
      })
      .catch(() => {
        navigate('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shareId, dispatch, navigate]);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-muted-foreground'>Loading recipe…</p>
      </div>
    );
  }

  if (!meal) return null;

  return (
    <div className='mx-auto max-w-4xl px-6 py-10'>
      <div className='mb-8'>
        <Link
          to='/'
          className='text-muted-foreground hover:text-foreground mb-4 inline-block text-sm'
        >
          ← Back to Home
        </Link>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-foreground mb-2 text-4xl font-bold'>{meal.title}</h1>
            <Badge
              variant='base'
              className={join('capitalize', MEAL_CATEGORY_COLORS[meal.category])}
            >
              {MEAL_CATEGORY_EMOJIS[meal.category]} {meal.category}
            </Badge>
          </div>
          <span className='text-muted-foreground shrink-0 text-xs'>
            Shared recipe
          </span>
        </div>
      </div>

      <div className='space-y-6'>
        {meal.imageUrl && (
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className='border-border h-64 w-full rounded-lg border object-cover'
          />
        )}

        <p className='text-foreground'>{meal.description}</p>

        <div className='border-border grid grid-cols-3 gap-4 rounded-lg border p-4'>
          <div className='text-center'>
            <div className='text-foreground text-2xl font-bold'>{meal.prepTime}m</div>
            <div className='text-muted-foreground text-xs'>Prep Time</div>
          </div>
          <div className='text-center'>
            <div className='text-foreground text-2xl font-bold'>{meal.cookTime}m</div>
            <div className='text-muted-foreground text-xs'>Cook Time</div>
          </div>
          <div className='text-center'>
            <div className='text-foreground text-2xl font-bold'>{meal.servingSize}</div>
            <div className='text-muted-foreground text-xs'>
              {meal.servingSize === 1 ? 'Serving' : 'Servings'}
            </div>
          </div>
        </div>

        {meal.ingredients.length > 0 && (
          <div>
            <h2 className='text-foreground mb-3 text-xl font-semibold'>Ingredients</h2>
            <ul className='border-border divide-border divide-y rounded-lg border'>
              {meal.ingredients.map((ing) => (
                <li
                  key={ing.ingredientId}
                  className='flex items-center justify-between px-4 py-2'
                >
                  <span className='text-foreground'>{ing.name}</span>
                  <span className='text-muted-foreground text-sm'>
                    {ing.servings} {ing.servings === 1 ? 'serving' : 'servings'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {meal.instructions.length > 0 && (
          <div>
            <h2 className='text-foreground mb-3 text-xl font-semibold'>Instructions</h2>
            <ol className='space-y-2'>
              {meal.instructions.map((step, index) => (
                <li key={index} className='flex gap-3'>
                  <span className='text-primary shrink-0 font-bold'>{index + 1}.</span>
                  <span className='text-foreground'>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className='border-border border-t pt-6'>
          <Button
            type='button'
            variant='primary'
            onClick={() => navigate('/')}
          >
            Get Demmi — Manage Your Own Recipes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SharedMealView;
