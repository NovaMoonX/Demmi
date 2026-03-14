import { Badge, Button, Card } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import type {
  AgentCreateMealAction,
  AgentMealProposal,
  AgentIngredientProposal,
  CreateMealAgentActionStatus,
} from '@lib/ollama/action-types/createMealAction.types';
import { MEAL_CATEGORY_COLORS, MEAL_CATEGORY_EMOJIS } from '@lib/meals';
import { INGREDIENT_TYPE_EMOJIS } from '@lib/ingredients';

const GENERATING_STATUSES = new Set<CreateMealAgentActionStatus>([
  'generating_name',
  'generating_info',
  'generating_description',
  'generating_ingredients',
  'generating_instructions',
]);

const STEP_LABELS: Partial<Record<CreateMealAgentActionStatus, string>> = {
  generating_name: 'Generating name…',
  generating_info: 'Generating basic info…',
  generating_description: 'Generating description…',
  generating_ingredients: 'Generating ingredients…',
  generating_instructions: 'Generating instructions…',
};

interface AgentActionCardProps {
  action: AgentCreateMealAction;
  onConfirmIntent: () => void;
  onRejectIntent: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function MealPreviewCard({ meal }: { meal: AgentMealProposal }) {
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
          <IngredientList ingredients={meal.ingredients} />
        )}
      </div>
    </Card>
  );
}

function IngredientList({ ingredients }: { ingredients: AgentIngredientProposal[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Ingredients
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ingredients.map((ing, i) => (
          <div
            key={i}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-muted text-muted-foreground"
          >
            <span>{INGREDIENT_TYPE_EMOJIS[ing.type]}</span>
            <span className="font-medium">{ing.name}</span>
            <span className="opacity-70">
              {ing.servings} {ing.unit}
            </span>
          </div>
        ))}
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
  if (action.status === 'pending_confirmation') {
    const name = action.proposedName || (action.meals[0]?.title ?? 'this recipe');
    const mealCount = action.meals.length;

    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🍽️</span>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              Sounds like you want to create{' '}
              {mealCount > 1 ? `${mealCount} recipes` : 'a recipe'} for{' '}
              <span className="font-semibold text-foreground">{name}</span>. Is that correct?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onConfirmIntent}>
            Yes, create it
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

  if (GENERATING_STATUSES.has(action.status)) {
    const name = (action.proposedName || action.recipe?.name) ?? 'your recipe';
    const stepLabel = STEP_LABELS[action.status] ?? 'Generating recipe…';

    return (
      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-muted-foreground">
            <span className="animate-bounce text-sm">●</span>
            <span className="animate-bounce text-sm [animation-delay:0.15s]">●</span>
            <span className="animate-bounce text-sm [animation-delay:0.3s]">●</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{name}</span>
            </p>
            <p className="text-xs text-muted-foreground">{stepLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  if (action.status === 'pending_approval') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <span className="font-semibold text-foreground text-sm">
            {action.meals.length === 1 ? 'Recipe ready' : `${action.meals.length} recipes ready`} — review before saving
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {action.meals.map((meal, i) => (
            <MealPreviewCard key={i} meal={meal} />
          ))}
        </div>

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
        <span className="text-base text-green-600 dark:text-green-400">✓</span>
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

  if (action.status === 'cancelled') {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Recipe generation was cancelled</span>
      </div>
    );
  }

  return null;
}
