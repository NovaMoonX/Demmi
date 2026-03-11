import { Badge, Button, Card } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useAppSelector } from '@store/hooks';
import type { AgentCreateMealAction, AgentMealProposal, AgentIngredientProposal } from '@lib/chat/agent-actions.types';
import { MEAL_CATEGORY_COLORS, MEAL_CATEGORY_EMOJIS } from '@lib/meals';
import { INGREDIENT_TYPE_EMOJIS } from '@lib/ingredients';

interface AgentActionCardProps {
  action: AgentCreateMealAction;
  onApprove: () => void;
  onReject: () => void;
}

interface ResolvedIngredient extends AgentIngredientProposal {
  isExisting: boolean;
}

interface ResolvedMeal extends AgentMealProposal {
  isDuplicate: boolean;
  ingredients: ResolvedIngredient[];
}

function MealPreview({ meal }: { meal: ResolvedMeal }) {
  const totalTime = meal.prepTime + meal.cookTime;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground text-base">{meal.title}</h4>
              {meal.isDuplicate && (
                <Badge variant="base" className="bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 shrink-0">
                  Already exists
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{meal.description}</p>
          </div>
          <span className="text-2xl shrink-0">{MEAL_CATEGORY_EMOJIS[meal.category]}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="base" className={join('capitalize', MEAL_CATEGORY_COLORS[meal.category])}>
            {meal.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Prep {meal.prepTime}m · Cook {meal.cookTime}m · {totalTime}m total
          </span>
          <span className="text-xs text-muted-foreground">
            {meal.servingSize} {meal.servingSize === 1 ? 'serving' : 'servings'}
          </span>
        </div>

        {meal.instructions.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {meal.instructions.length} instruction {meal.instructions.length === 1 ? 'step' : 'steps'}
          </div>
        )}

        {meal.ingredients.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ingredients
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meal.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className={join(
                    'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                    ing.isExisting
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary border border-primary/20',
                  )}
                >
                  <span>{INGREDIENT_TYPE_EMOJIS[ing.type]}</span>
                  <span className="font-medium">{ing.name}</span>
                  <span className="opacity-70">
                    {ing.servings} {ing.unit}
                  </span>
                  {!ing.isExisting && (
                    <span className="ml-0.5 font-semibold text-primary">+new</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function AgentActionCard({ action, onApprove, onReject }: AgentActionCardProps) {
  const existingMeals = useAppSelector((state) => state.meals.items);
  const existingIngredients = useAppSelector((state) => state.ingredients.items);

  const resolvedMeals: ResolvedMeal[] = action.meals.map((meal) => ({
    ...meal,
    isDuplicate: existingMeals.some(
      (m) => m.title.toLowerCase() === meal.title.toLowerCase(),
    ),
    ingredients: meal.ingredients.map((ing) => ({
      ...ing,
      isExisting: existingIngredients.some(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase(),
      ),
    })),
  }));

  const allDuplicates = resolvedMeals.every((m) => m.isDuplicate);
  const newIngredientCount = resolvedMeals.reduce(
    (sum, meal) => sum + meal.ingredients.filter((i) => !i.isExisting).length,
    0,
  );
  const newMealCount = resolvedMeals.filter((m) => !m.isDuplicate).length;

  const isPending = action.status === 'pending';
  const isApproved = action.status === 'approved';
  const isRejected = action.status === 'rejected';

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🍽️</span>
        <span className="font-semibold text-foreground text-sm">
          {action.meals.length === 1
            ? 'New Meal Proposal'
            : `${action.meals.length} New Meal Proposals`}
        </span>
        {isApproved && (
          <Badge variant="base" className="bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 ml-auto">
            ✓ Saved
          </Badge>
        )}
        {isRejected && (
          <Badge variant="base" className="bg-muted text-muted-foreground ml-auto">
            Declined
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {resolvedMeals.map((meal, i) => (
          <MealPreview key={i} meal={meal} />
        ))}
      </div>

      {isPending && (
        <>
          {allDuplicates && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ {action.meals.length === 1 ? 'This meal already exists' : 'All meals already exist'} in your collection.
            </p>
          )}
          {!allDuplicates && (newMealCount > 0 || newIngredientCount > 0) && (
            <p className="text-xs text-muted-foreground">
              Will create{' '}
              {newMealCount > 0 && (
                <span className="text-primary font-medium">
                  {newMealCount} {newMealCount === 1 ? 'meal' : 'meals'}
                </span>
              )}
              {newMealCount > 0 && newIngredientCount > 0 && ' and '}
              {newIngredientCount > 0 && (
                <span className="text-primary font-medium">
                  {newIngredientCount} new {newIngredientCount === 1 ? 'ingredient' : 'ingredients'}
                </span>
              )}
              .
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              disabled={allDuplicates}
            >
              ✓ Save to My Meals
            </Button>
            <Button variant="secondary" size="sm" onClick={onReject}>
              Decline
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💬 Not quite right? Reply to adjust the details.
          </p>
        </>
      )}
    </div>
  );
}
