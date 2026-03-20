import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Badge } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useAppSelector } from '@store/hooks';
import { Meal, MEAL_CATEGORY_COLORS, MEAL_CATEGORY_EMOJIS } from '@lib/meals';
import { Ingredient } from '@lib/ingredients';

export function CookMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const meals = useAppSelector((state) => state.meals.items);
  const allIngredients = useAppSelector((state) => state.ingredients.items);

  const meal = meals.find((m) => m.id === id);

  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);

  if (!meal) {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4'>
        <p className='text-muted-foreground'>Meal not found.</p>
        <Link to='/meals' className='text-primary text-sm underline'>
          ← Back to Meals
        </Link>
      </div>
    );
  }

  const steps = meal.instructions;
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handlePrev = () => {
    if (!isFirstStep) setCurrentStep((s) => s - 1);
  };

  const handleNext = () => {
    if (!isLastStep) setCurrentStep((s) => s + 1);
  };

  const handleFinish = () => {
    navigate(`/meals/${meal.id}`);
  };

  return (
    <div className='bg-background relative flex h-screen w-full flex-col overflow-hidden xl:flex-row'>
      <DesktopSidebar meal={meal} />

      <div className='flex flex-1 flex-col overflow-hidden'>
        <TopBar
          meal={meal}
          onClose={() => navigate(`/meals/${meal.id}`)}
          onToggleIngredients={() => setShowIngredients((v) => !v)}
          showIngredients={showIngredients}
          hasIngredients={meal.ingredients.length > 0}
        />

        {totalSteps === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-4 p-6'>
            <p className='text-muted-foreground text-lg'>No steps available for this meal.</p>
            <Button variant='secondary' onClick={() => navigate(`/meals/${meal.id}`)}>
              ← Back to Meal
            </Button>
          </div>
        ) : (
          <>
            <StepView
              step={steps[currentStep]}
              stepIndex={currentStep}
              totalSteps={totalSteps}
            />

            <BottomNav
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              onPrev={handlePrev}
              onNext={handleNext}
              onFinish={handleFinish}
            />
          </>
        )}
      </div>

      {showIngredients && (
        <IngredientsPanel
          meal={meal}
          allIngredients={allIngredients}
          onClose={() => setShowIngredients(false)}
        />
      )}
    </div>
  );
}

function TopBar({
  meal,
  onClose,
  onToggleIngredients,
  showIngredients,
  hasIngredients,
}: {
  meal: Meal;
  onClose: () => void;
  onToggleIngredients: () => void;
  showIngredients: boolean;
  hasIngredients: boolean;
}) {
  return (
    <div className='border-border flex items-center justify-between border-b px-4 py-3'>
      <button
        onClick={onClose}
        className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors'
        aria-label='Exit cook mode'
      >
        <span className='text-lg leading-none'>✕</span>
        <span className='hidden sm:inline'>Exit</span>
      </button>

      <div className='flex min-w-0 flex-col items-center'>
        <span className='text-foreground max-w-[180px] truncate text-sm font-semibold sm:max-w-xs'>
          {meal.title}
        </span>
        <Badge
          variant='base'
          className={join('mt-0.5 text-xs capitalize', MEAL_CATEGORY_COLORS[meal.category])}
        >
          {MEAL_CATEGORY_EMOJIS[meal.category]} {meal.category}
        </Badge>
      </div>

      {hasIngredients ? (
        <button
          onClick={onToggleIngredients}
          className={join(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            showIngredients
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
          aria-label='Toggle ingredients panel'
        >
          🧂 <span className='hidden sm:inline'>Ingredients</span>
        </button>
      ) : (
        <div className='w-16' />
      )}
    </div>
  );
}

function StepView({
  step,
  stepIndex,
  totalSteps,
}: {
  step: string;
  stepIndex: number;
  totalSteps: number;
}) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center px-6 py-8 xl:px-12'>
      <div className='w-full max-w-2xl'>
        <div className='mb-8 flex flex-col items-center gap-3'>
          <span className='text-primary text-sm font-semibold uppercase tracking-widest'>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <ProgressDots total={totalSteps} current={stepIndex} />
        </div>

        <p className='text-foreground text-center text-2xl font-medium leading-relaxed sm:text-3xl xl:text-4xl'>
          {step}
        </p>
      </div>
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  const maxDots = 10;
  const dots = Math.min(total, maxDots);

  const dotIndex =
    total <= maxDots
      ? current
      : total === 1
        ? 0
        : Math.round((current / (total - 1)) * (dots - 1));

  return (
    <div className='flex items-center gap-2'>
      {Array.from({ length: dots }).map((_, i) => (
        <div
          key={i}
          className={join(
            'rounded-full transition-all duration-300',
            i === dotIndex ? 'bg-primary h-2.5 w-2.5' : 'bg-muted-foreground/30 h-1.5 w-1.5',
          )}
        />
      ))}
    </div>
  );
}

function BottomNav({
  isFirstStep,
  isLastStep,
  onPrev,
  onNext,
  onFinish,
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  return (
    <div className='border-border flex items-center justify-between border-t px-6 py-4 xl:px-12'>
      <Button
        variant='secondary'
        onClick={onPrev}
        disabled={isFirstStep}
        className='min-w-[100px]'
      >
        ← Prev
      </Button>

      {isLastStep ? (
        <Button variant='primary' onClick={onFinish} className='min-w-[120px]'>
          🎉 Done!
        </Button>
      ) : (
        <Button variant='primary' onClick={onNext} className='min-w-[100px]'>
          Next →
        </Button>
      )}
    </div>
  );
}

function DesktopSidebar({ meal }: { meal: Meal }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className='border-border bg-muted/30 hidden w-80 shrink-0 flex-col border-r xl:flex'>
      <div className='h-64 w-full overflow-hidden'>
        {meal.imageUrl && !imgError ? (
          <img
            src={meal.imageUrl}
            alt={meal.title}
            className='h-full w-full object-cover'
            onError={() => setImgError(true)}
          />
        ) : (
          <div className='bg-muted flex h-full w-full items-center justify-center'>
            <span className='text-6xl'>{MEAL_CATEGORY_EMOJIS[meal.category]}</span>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-4 overflow-y-auto p-5'>
        <div>
          <h2 className='text-foreground text-xl font-bold'>{meal.title}</h2>
          <Badge
            variant='base'
            className={join('mt-1 capitalize', MEAL_CATEGORY_COLORS[meal.category])}
          >
            {MEAL_CATEGORY_EMOJIS[meal.category]} {meal.category}
          </Badge>
        </div>

        <p className='text-muted-foreground text-sm leading-relaxed'>{meal.description}</p>

        <div className='border-border grid grid-cols-3 gap-2 rounded-lg border p-3'>
          <div className='text-center'>
            <div className='text-foreground text-lg font-bold'>{meal.prepTime}m</div>
            <div className='text-muted-foreground text-xs'>Prep</div>
          </div>
          <div className='text-center'>
            <div className='text-foreground text-lg font-bold'>{meal.cookTime}m</div>
            <div className='text-muted-foreground text-xs'>Cook</div>
          </div>
          <div className='text-center'>
            <div className='text-foreground text-lg font-bold'>{meal.servingSize}</div>
            <div className='text-muted-foreground text-xs'>
              {meal.servingSize === 1 ? 'Serving' : 'Servings'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IngredientsPanel({
  meal,
  allIngredients,
  onClose,
}: {
  meal: Meal;
  allIngredients: Ingredient[];
  onClose: () => void;
}) {
  return (
    <>
      <div
        className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden'
        onClick={onClose}
        aria-hidden='true'
      />

      <div
        className={join(
          'bg-background border-border fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t shadow-xl',
          'xl:static xl:w-72 xl:max-h-none xl:rounded-none xl:border-l xl:border-t-0 xl:shadow-none',
        )}
      >
        <div className='bg-background sticky top-0 z-10'>
          <div className='flex items-center justify-between px-5 py-4'>
            <h3 className='text-foreground font-semibold'>
              🧂 Ingredients ({meal.ingredients.length})
            </h3>
            <button
              onClick={onClose}
              className='text-muted-foreground hover:text-foreground transition-colors'
              aria-label='Close ingredients panel'
            >
              ✕
            </button>
          </div>
          <div className='border-border border-b' />
        </div>

        <ul className='divide-border divide-y px-2 pb-4'>
          {meal.ingredients.map((ing) => {
            const ingredient = allIngredients.find((i) => i.id === ing.ingredientId);
            return (
              <li
                key={ing.ingredientId}
                className='flex items-center justify-between px-3 py-3'
              >
                <span className='text-foreground text-sm font-medium'>
                  {ingredient?.name ?? 'Unknown'}
                </span>
                <span className='text-muted-foreground text-sm'>
                  {ing.servings} {ing.servings === 1 ? 'serving' : 'servings'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default CookMode;
