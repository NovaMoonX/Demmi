import { Badge, Button, Card } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { useAppSelector } from '@store/hooks';
import type {
  AgentCreateMealAction,
  AgentMealProposal,
  AgentIngredientProposal,
  SimilarMealResult,
} from '@lib/chat/agent-actions.types';
import { MEAL_CATEGORY_COLORS, MEAL_CATEGORY_EMOJIS } from '@lib/meals';
import { INGREDIENT_TYPE_EMOJIS } from '@lib/ingredients';

interface AgentActionCardProps {
  action: AgentCreateMealAction;
  onConfirmIntent: () => void;
  onRejectIntent: () => void;
  onApprove: () => void;
  onReject: () => void;
}

interface ResolvedIngredient extends AgentIngredientProposal {
  isExisting: boolean;
}

interface ResolvedMeal extends AgentMealProposal {
  ingredients: ResolvedIngredient[];
}

function IntentSummary({ meals }: { meals: AgentMealProposal[] }) {
  if (meals.length === 1) {
    return (
      <span>
        <span className="font-semibold text-foreground">{meals[0].title}</span>
      </span>
    );
  }
  return (
    <span>
      {meals.length} meals:{' '}
      {meals.map((m, i) => (
        <span key={i}>
          {i > 0 && ', '}
          <span className="font-semibold text-foreground">{m.title}</span>
        </span>
      ))}
    </span>
  );
}

function MealPreviewCard({ meal }: { meal: ResolvedMeal }) {
  const totalTime = meal.prepTime + meal.cookTime;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-base">{meal.title}</h4>
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

function SimilarMealEntry({ result }: { result: SimilarMealResult }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
      <span className="text-base">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          "{result.proposedTitle}"
        </p>
        <p className="text-xs text-muted-foreground">
          Similar to existing meal: <span className="font-medium text-foreground">"{result.existingTitle}"</span>
          <span className="ml-1 opacity-60">({Math.round(result.similarity * 100)}% match)</span>
        </p>
      </div>
    </div>
  );
}

export function AgentActionCard({
  action,
  onConfirmIntent,
  onRejectIntent,
  onApprove,
  onReject,
}: AgentActionCardProps) {
  const existingIngredients = useAppSelector((state) => state.ingredients.items);

  const resolvedMeals: ResolvedMeal[] = action.meals.map((meal) => ({
    ...meal,
    ingredients: meal.ingredients.map((ing) => ({
      ...ing,
      isExisting: existingIngredients.some(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase(),
      ),
    })),
  }));

  const newIngredientCount = resolvedMeals.reduce(
    (sum, meal) => sum + meal.ingredients.filter((i) => !i.isExisting).length,
    0,
  );

  if (action.status === 'pending_confirmation') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🍽️</span>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              Sounds like you want to create{' '}
              {action.meals.length === 1 ? 'a meal' : `${action.meals.length} meals`}:{' '}
              <IntentSummary meals={action.meals} />
              . Is that correct?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onConfirmIntent}>
            Yes, create {action.meals.length === 1 ? 'it' : 'them'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onRejectIntent}>
            No, cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💬 Not quite right? Reply to adjust the details first.
        </p>
      </div>
    );
  }

  if (action.status === 'searching') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <span className="animate-bounce text-sm">●</span>
            <span className="animate-bounce text-sm [animation-delay:0.15s]">●</span>
            <span className="animate-bounce text-sm [animation-delay:0.3s]">●</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Searching your meals for something similar…
          </p>
        </div>
      </div>
    );
  }

  if (action.status === 'similar_found') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="font-semibold text-foreground text-sm">Similar Meal Found</span>
        </div>
        <p className="text-sm text-muted-foreground">
          We found existing meals that are very similar to what you asked for. Creation cancelled to avoid duplicates.
        </p>
        <div className="flex flex-col gap-2">
          {action.similarMeals.map((result, i) => (
            <SimilarMealEntry key={i} result={result} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          💬 Want something different? Reply with more details to refine.
        </p>
      </div>
    );
  }

  if (action.status === 'pending_approval') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <span className="font-semibold text-foreground text-sm">
            No similar meals found —{' '}
            {action.meals.length === 1 ? 'ready to create' : `ready to create ${action.meals.length} meals`}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {resolvedMeals.map((meal, i) => (
            <MealPreviewCard key={i} meal={meal} />
          ))}
        </div>

        {newIngredientCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Will also create{' '}
            <span className="text-primary font-medium">
              {newIngredientCount} new {newIngredientCount === 1 ? 'ingredient' : 'ingredients'}
            </span>{' '}
            marked with <span className="text-primary font-semibold">+new</span>.
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onApprove}>
            ✓ Save to My Meals
          </Button>
          <Button variant="secondary" size="sm" onClick={onReject}>
            Decline
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💬 Not quite right? Reply to adjust the details.
        </p>
      </div>
    );
  }

  if (action.status === 'approved') {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3">
        <span className="text-base">✓</span>
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          {action.meals.length === 1 ? 'Meal saved' : `${action.meals.length} meals saved`} to your collection
        </span>
      </div>
    );
  }

  if (action.status === 'rejected') {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Declined</span>
      </div>
    );
  }

  return null;
}
