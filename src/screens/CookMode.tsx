import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Drawer } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useAppSelector } from '@store/hooks';
import { MEAL_CATEGORY_EMOJIS } from '@lib/meals';

export function CookMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meals = useAppSelector((state) => state.meals.items);
  const allIngredients = useAppSelector((state) => state.ingredients.items);

  const meal = useMemo(() => meals.find((m) => m.id === id), [meals, id]);

  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [servings, setServings] = useState(meal?.servingSize ?? 1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!meal) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4'>
        <p className='text-muted-foreground text-lg'>Meal not found.</p>
        <Button variant='secondary' onClick={() => navigate('/meals')}>
          Back to Meals
        </Button>
      </div>
    );
  }

  if (meal.instructions.length === 0) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4 p-6'>
        <p className='text-muted-foreground text-lg'>
          This meal has no instructions yet.
        </p>
        <Link
          to={`/meals/${meal.id}`}
          className='text-primary hover:text-primary/80 text-sm underline'
        >
          ← Back to {meal.title}
        </Link>
      </div>
    );
  }

  const totalSteps = meal.instructions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const formatTime = (totalSecs: number) => {
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const scaleFactor = meal.servingSize > 0 ? servings / meal.servingSize : 1;

  const getScaledAmount = (baseServings: number) => {
    return Number((baseServings * scaleFactor).toFixed(2));
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      navigate(`/meals/${meal.id}`);
    }
  };

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const ingredientsContent = (
    <>
      <div className='mb-4 flex items-center justify-between'>
        <span className='text-foreground text-sm font-semibold'>Servings</span>
        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            size='icon'
            aria-label='Decrease servings'
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            disabled={servings <= 1}
          >
            −
          </Button>
          <span className='text-foreground w-8 text-center font-bold'>
            {servings}
          </span>
          <Button
            variant='secondary'
            size='icon'
            aria-label='Increase servings'
            onClick={() => setServings((s) => s + 1)}
          >
            +
          </Button>
        </div>
      </div>
      <ul className='divide-border divide-y'>
        {meal.ingredients.length === 0 ? (
          <li className='text-muted-foreground py-4 text-center text-sm'>
            No ingredients listed.
          </li>
        ) : (
          meal.ingredients.map((ing) => {
            const ingredient = allIngredients.find(
              (i) => i.id === ing.ingredientId,
            );
            const scaledAmount = getScaledAmount(ing.servings);
            return (
              <li
                key={ing.ingredientId}
                className='flex items-center justify-between py-3'
              >
                <span className='text-foreground font-medium'>
                  {ingredient?.name ?? 'Unknown Ingredient'}
                </span>
                <span className='text-muted-foreground text-sm'>
                  {scaledAmount} {scaledAmount === 1 ? 'serving' : 'servings'}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </>
  );

  return (
    <div className='bg-background flex h-full flex-col overflow-hidden md:flex-row'>
      {/* Desktop: Left panel with image and meal info */}
      <div className='hidden shrink-0 flex-col md:flex md:w-80 lg:w-96'>
        <div className='flex flex-col overflow-y-auto'>
          {meal.imageUrl ? (
            <img
              src={meal.imageUrl}
              alt={meal.title}
              className='h-64 w-full object-cover lg:h-80'
            />
          ) : (
            <div className='bg-muted flex h-64 w-full items-center justify-center lg:h-80'>
              <span className='text-6xl'>
                {MEAL_CATEGORY_EMOJIS[meal.category]}
              </span>
            </div>
          )}

          <div className='flex flex-1 flex-col gap-4 p-6'>
            <div>
              <Link
                to={`/meals/${meal.id}`}
                className='text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm'
              >
                ← Back
              </Link>
              <h1 className='text-foreground mb-1 text-2xl font-bold'>
                {meal.title}
              </h1>
              <p className='text-muted-foreground text-sm'>
                {meal.description}
              </p>
            </div>

            <div className='border-border grid grid-cols-3 gap-3 rounded-lg border p-3 text-center text-sm'>
              <div>
                <div className='text-foreground font-bold'>
                  {meal.prepTime}m
                </div>
                <div className='text-muted-foreground text-xs'>Prep</div>
              </div>
              <div>
                <div className='text-foreground font-bold'>
                  {meal.cookTime}m
                </div>
                <div className='text-muted-foreground text-xs'>Cook</div>
              </div>
              <div>
                <div className='text-foreground font-bold'>
                  {meal.servingSize}
                </div>
                <div className='text-muted-foreground text-xs'>
                  {meal.servingSize === 1 ? 'Serving' : 'Servings'}
                </div>
              </div>
            </div>

            {meal.ingredients.length > 0 && (
              <div>
                <h2 className='text-foreground mb-2 text-sm font-semibold uppercase tracking-wide'>
                  Ingredients
                </h2>
                {ingredientsContent}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main cooking area */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Mobile header */}
        <div className='border-border shrink-0 border-b md:hidden'>
          <div className='flex items-center justify-center px-4 py-3'>
            <h1 className='text-foreground max-w-[70%] truncate text-center text-sm font-semibold'>
              {meal.title}
            </h1>
          </div>
          <div className='flex items-center justify-center gap-1.5 pb-2'>
            <span className='text-primary text-sm'>⏱</span>
            <span className='text-primary font-mono text-sm font-semibold'>
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Desktop header */}
        <div className='border-border hidden shrink-0 items-center justify-between border-b px-6 py-4 md:flex'>
          <div className='flex items-center gap-3'>
            <h2 className='text-foreground font-semibold'>Cook Mode</h2>
            <span className='bg-primary/10 text-primary rounded-full px-3 py-1 font-mono text-sm font-semibold'>
              ⏱ {formatTime(elapsedSeconds)}
            </span>
          </div>
          <span className='text-muted-foreground text-sm'>
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className='bg-muted h-1 w-full shrink-0'>
          <div
            className='bg-primary h-1 transition-all duration-300 ease-in-out'
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step content */}
        <div className='relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 md:px-12'>
          <Button
            variant='tertiary'
            onClick={() => setShowIngredients(true)}
            className='absolute top-3 right-3 md:hidden'
          >
            Ingredients
          </Button>
          <div className='w-full max-w-2xl'>
            <div className='mb-4 flex items-center gap-3'>
              <span className='bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold'>
                {currentStep + 1}
              </span>
              <span className='text-muted-foreground text-sm'>
                of {totalSteps} steps
              </span>
            </div>

            <p className='text-foreground text-xl leading-relaxed font-medium md:text-2xl lg:text-3xl'>
              {meal.instructions[currentStep]}
            </p>
          </div>
        </div>

        {/* Step indicators (dots) */}
        <div className='flex shrink-0 justify-center gap-1.5 px-6 pb-4'>
          {meal.instructions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={join(
                'h-2 rounded-full transition-all duration-200',
                i === currentStep
                  ? 'bg-primary w-6'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2',
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className='border-border shrink-0 border-t px-4 py-4 md:px-6'>
          <div className='mx-auto flex w-full max-w-2xl gap-3'>
            <Link
              to={`/meals/${meal.id}`}
              className='text-muted-foreground hover:text-foreground hover:bg-muted flex shrink-0 items-center justify-center rounded-md px-3 text-sm transition-colors md:hidden'
              aria-label='Exit cook mode'
            >
              ✕
            </Link>
            <Button
              variant='secondary'
              onClick={handlePrev}
              disabled={isFirstStep}
              className='flex-1'
            >
              ← Previous
            </Button>
            <Button
              variant='primary'
              onClick={handleNext}
              className='flex-1'
            >
              {isLastStep ? '🎉 Done!' : 'Next →'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: Ingredients Drawer */}
      <Drawer
        isOpen={showIngredients}
        onClose={() => setShowIngredients(false)}
        title='Ingredients'
        showCloseButton
        enableDragGestures
      >
        <div className='px-4 pb-6'>
          {ingredientsContent}
        </div>
      </Drawer>
    </div>
  );
}

export default CookMode;
