import type { MealCategory } from '@lib/meals';
import type { IngredientType, MeasurementUnit } from '@lib/ingredients';
import { store } from '@store/index';
import { ollamaClient } from '../ollama.service';
import { MEAL_ITERATION_VALIDATION_PROMPT, buildFieldDetectionPrompt } from '../prompts/meal.prompts';
import { MEAL_FIELD_DETECTION_SCHEMA, MEAL_ITERATION_VALIDATION_SCHEMA } from '../schemas/meal.schemas';
import type {
  ActionHandler,
  ActionStep,
  ActionContext,
  ActionRuntime,
  MultiStepActionResult,
  MultiStepActionRuntime,
  StepResult,
} from './types';
import type {
  AgentMealProposal,
  AgentIngredientProposal,
  MealIterableField,
} from '../action-types/createMealAction.types';
import {
  proposeNameStep,
  generateBasicInfoStep,
  generateDescriptionStep,
  generateIngredientsStep,
  generateInstructionsStep,
  formatContextMessages,
} from './createMealAction';
import type { MealResult, MealStepName } from './createMealAction';

/** Detection step names — one per iterable field, in evaluation order. */
export type FieldDetectStepName =
  | 'detectNameUpdate'
  | 'detectInfoUpdate'
  | 'detectDescriptionUpdate'
  | 'detectIngredientsUpdate'
  | 'detectInstructionsUpdate';

export type MealIterationStepName =
  | 'validateIterationRequest'
  | 'detectFieldsToUpdate'
  | MealStepName;

export interface MealIterationResult extends Record<string, unknown> {
  iterationValid: boolean;
  agentMessage: string;
  fieldsToUpdate: MealIterableField[];
  existingProposal: AgentMealProposal;
  name: string;
  category: MealCategory;
  servings: number;
  totalTime: number;
  description: string;
  ingredients: Array<{ name: string; type: IngredientType; unit: MeasurementUnit; servings: number }>;
  instructions: string[];
  proposal: AgentMealProposal;
}

/** Ordered list of fields to evaluate — order matters because later steps see earlier decisions. */
const FIELD_DETECTION_ORDER: MealIterableField[] = [
  'name',
  'info',
  'description',
  'ingredients',
  'instructions',
];

const FIELD_TO_STEP: Array<{ field: MealIterableField; step: ActionStep<MealResult, MealStepName> }> = [
  { field: 'name', step: proposeNameStep },
  { field: 'info', step: generateBasicInfoStep },
  { field: 'description', step: generateDescriptionStep },
  { field: 'ingredients', step: generateIngredientsStep },
  { field: 'instructions', step: generateInstructionsStep },
];

function formatProposalForPrompt(proposal: AgentMealProposal): string {
  const ingredientsList = proposal.ingredients
    .map((i) => `  - ${i.name} (${i.servings} ${i.unit})`)
    .join('\n');
  const totalTime = proposal.prepTime + proposal.cookTime;

  return [
    `Title: ${proposal.title}`,
    `Category: ${proposal.category}`,
    `Servings: ${proposal.servingSize}`,
    `Total time: ${totalTime} min (prep ${proposal.prepTime}m, cook ${proposal.cookTime}m)`,
    `Description: ${proposal.description}`,
    `Ingredients:\n${ingredientsList}`,
    `Instructions: ${proposal.instructions.length} steps`,
  ].join('\n');
}

function formatPriorDecisions(
  decisions: Array<{ field: MealIterableField; shouldUpdate: boolean; reason: string }>,
): string {
  return decisions
    .map(({ field, shouldUpdate, reason }) => {
      const status = shouldUpdate ? 'NEEDS UPDATE' : 'NO CHANGE';
      return `- ${field}: ${status} — ${reason}`;
    })
    .join('\n');
}

/**
 * Runs 5 sequential per-field LLM calls (name → info → description → ingredients → instructions).
 * Each call is focused on one field only and receives all prior field decisions as context,
 * enabling cascading reasoning (e.g. "ingredients changed → instructions must be re-checked").
 * Returns { fieldsToUpdate } — the subset of fields where shouldUpdate was true.
 *
 * Can be invoked in isolation via iterateMealAction.executeStep('detectFieldsToUpdate', ...).
 */
export const detectFieldsToUpdateStep: ActionStep<MealIterationResult, 'detectFieldsToUpdate'> = {
  name: 'detectFieldsToUpdate',

  async execute(
    model: string,
    context: ActionContext<MealIterationResult>,
    runtime: ActionRuntime,
  ): Promise<StepResult<MealIterationResult, 'detectFieldsToUpdate'>> {
    const { abortSignal } = runtime;
    const existingProposal = context.previousResults?.existingProposal;

    if (!existingProposal) {
      return { stepName: 'detectFieldsToUpdate', data: { fieldsToUpdate: [] } };
    }

    if (abortSignal?.aborted) {
      return { stepName: 'detectFieldsToUpdate', data: { fieldsToUpdate: [] }, cancelled: true };
    }

    const proposalSummary = formatProposalForPrompt(existingProposal);
    const priorDecisions: Array<{ field: MealIterableField; shouldUpdate: boolean; reason: string }> = [];

    for (const field of FIELD_DETECTION_ORDER) {
      if (abortSignal?.aborted) {
        return { stepName: 'detectFieldsToUpdate', data: { fieldsToUpdate: [] }, cancelled: true };
      }

      const priorDecisionsText = formatPriorDecisions(priorDecisions);
      const systemContent = `${buildFieldDetectionPrompt(field, priorDecisionsText)}\n\nCurrent recipe:\n${proposalSummary}`;

      const response = await ollamaClient.chat({
        model,
        messages: [
          { role: 'system', content: systemContent },
          ...formatContextMessages(context.messages),
        ],
        stream: false,
        format: MEAL_FIELD_DETECTION_SCHEMA,
      });

      if (abortSignal?.aborted) {
        return { stepName: 'detectFieldsToUpdate', data: { fieldsToUpdate: [] }, cancelled: true };
      }

      const parsed = JSON.parse(response.message.content);
      const shouldUpdate: boolean = parsed.shouldUpdate === true;
      const reason: string = parsed.reason ?? '';

      priorDecisions.push({ field, shouldUpdate, reason });
    }

    const fieldsToUpdate: MealIterableField[] = priorDecisions
      .filter((d) => d.shouldUpdate)
      .map((d) => d.field);

    return { stepName: 'detectFieldsToUpdate', data: { fieldsToUpdate } };
  },
};

export const validateIterationRequestStep: ActionStep<MealIterationResult, 'validateIterationRequest'> = {
  name: 'validateIterationRequest',

  async execute(
    model: string,
    context: ActionContext<MealIterationResult>,
    runtime: ActionRuntime,
  ): Promise<StepResult<MealIterationResult, 'validateIterationRequest'>> {
    const { abortSignal } = runtime;
    const existingProposal = context.previousResults?.existingProposal;

    if (!existingProposal) {
      return {
        stepName: 'validateIterationRequest',
        data: {
          iterationValid: false,
          agentMessage: "I couldn't find a recipe to refine. Please start a new recipe creation.",
        },
      };
    }

    if (abortSignal?.aborted) {
      // agentMessage is intentionally empty — cancelled results are never shown to the user.
      return { stepName: 'validateIterationRequest', data: { iterationValid: false, agentMessage: '' }, cancelled: true };
    }

    const proposalSummary = formatProposalForPrompt(existingProposal);

    // Validation only inspects the single latest user message — we don't want prior
    // conversation context to influence whether this particular message is valid.
    const lastMessage = context.messages[context.messages.length - 1];
    const lastUserContent = lastMessage?.rawContent ?? lastMessage?.content ?? '';

    const response = await ollamaClient.chat({
      model,
      messages: [
        {
          role: 'system',
          content: `${MEAL_ITERATION_VALIDATION_PROMPT}\n\nCurrent recipe:\n${proposalSummary}`,
        },
        { role: 'user', content: lastUserContent },
      ],
      stream: false,
      format: MEAL_ITERATION_VALIDATION_SCHEMA,
    });

    if (abortSignal?.aborted) {
      return { stepName: 'validateIterationRequest', data: { iterationValid: false, agentMessage: '' }, cancelled: true };
    }

    const parsed = JSON.parse(response.message.content);
    const iterationValid: boolean = parsed.valid === true;
    const agentMessage: string = parsed.agentMessage ?? '';

    return { stepName: 'validateIterationRequest', data: { iterationValid, agentMessage } };
  },
};

export const iterateMealAction = {
  type: 'iterateMeal' as const,
  description: 'Refine an existing meal proposal by regenerating only the fields that need to change',
  isMultiStep: true,

  steps: [validateIterationRequestStep, detectFieldsToUpdateStep],

  async executeStep(
    model: string,
    stepName: MealIterationStepName,
    context: ActionContext<MealIterationResult>,
    runtime: ActionRuntime,
  ): Promise<StepResult<MealIterationResult, MealIterationStepName>> {
    if (stepName === 'validateIterationRequest') {
      return validateIterationRequestStep.execute(model, context, runtime);
    }
    if (stepName === 'detectFieldsToUpdate') {
      return detectFieldsToUpdateStep.execute(model, context, runtime);
    }
    const entry = FIELD_TO_STEP.find((e) => e.step.name === stepName);
    if (!entry) {
      throw new Error(`Unknown iteration step: ${stepName}`);
    }
    const result = await entry.step.execute(
      model,
      context as unknown as ActionContext<MealResult>,
      runtime,
    );
    return result as StepResult<MealIterationResult, MealIterationStepName>;
  },

  async execute(
    model: string,
    context: ActionContext<MealIterationResult>,
    runtime: MultiStepActionRuntime,
  ): Promise<MultiStepActionResult<MealIterationResult, MealIterationStepName>> {
    const completedSteps: MealIterationStepName[] = [];
    const existingProposal = context.previousResults?.existingProposal;

    if (!existingProposal) {
      return { data: {}, completedSteps, cancelled: true };
    }

    // Step 1: Validate that the user's message is actually about refining the recipe.
    const validationResult = await validateIterationRequestStep.execute(model, context, runtime);

    if (validationResult.cancelled) {
      return { data: {}, completedSteps, cancelled: true };
    }

    const iterationValid = validationResult.data.iterationValid as boolean;
    const agentMessage = (validationResult.data.agentMessage as string) ?? '';
    completedSteps.push('validateIterationRequest');

    // Notify consumer immediately with the agent's acknowledgment or refusal.
    runtime.onStepComplete?.('validateIterationRequest', { iterationValid, agentMessage });

    if (!iterationValid) {
      // Not a valid refinement request — communicate this to the consumer and stop.
      return {
        data: { iterationValid, agentMessage, existingProposal },
        completedSteps,
        cancelled: false,
      };
    }

    // Step 2: Detect which fields need updating via 5 sequential per-field LLM calls.
    const fieldResult = await detectFieldsToUpdateStep.execute(model, context, runtime);

    if (fieldResult.cancelled) {
      return { data: { iterationValid, agentMessage }, completedSteps, cancelled: true };
    }

    const fieldsToUpdate: MealIterableField[] =
      (fieldResult.data.fieldsToUpdate as MealIterableField[]) ?? [];
    completedSteps.push('detectFieldsToUpdate');

    // Notify consumer so it can show per-field loading skeletons.
    runtime.onStepComplete?.('detectFieldsToUpdate', { fieldsToUpdate });

    if (fieldsToUpdate.length === 0 || runtime.abortSignal?.aborted) {
      return { data: { iterationValid, agentMessage, fieldsToUpdate, existingProposal }, completedSteps, cancelled: false };
    }

    // Pre-populate accumulated result from the existing proposal so steps that are
    // NOT being regenerated still have correct values to pass as context.
    const accumulatedResult: Partial<MealIterationResult> = {
      iterationValid,
      agentMessage,
      fieldsToUpdate,
      existingProposal,
      name: existingProposal.title,
      category: existingProposal.category,
      servings: existingProposal.servingSize,
      totalTime: existingProposal.prepTime + existingProposal.cookTime,
      description: existingProposal.description,
      ingredients: existingProposal.ingredients.map((ing) => ({
        name: ing.name,
        type: ing.type,
        unit: ing.unit,
        servings: ing.servings,
      })),
      instructions: existingProposal.instructions,
    };

    const stepsToRun = FIELD_TO_STEP.filter(({ field }) => fieldsToUpdate.includes(field));

    for (const { field, step } of stepsToRun) {
      if (runtime.abortSignal?.aborted) break;

      const stepContext: ActionContext<MealResult> = {
        messages: context.messages,
        previousResults: accumulatedResult as Partial<MealResult>,
      };

      const stepResult = await step.execute(model, stepContext, runtime);

      if (stepResult.cancelled) break;

      Object.assign(accumulatedResult, stepResult.data);
      completedSteps.push(step.name as MealIterationStepName);

      // Notify consumer about the completed step so the UI can update only the changed field.
      if (runtime.onStepComplete) {
        if (field === 'ingredients' && Array.isArray(stepResult.data.ingredients)) {
          const existingIngredients = store.getState().ingredients.items;
          const proposals: AgentIngredientProposal[] = (
            stepResult.data.ingredients as Array<Record<string, unknown>>
          ).map((ing) => {
            const match = existingIngredients.find(
              (e) => e.name.toLowerCase() === String(ing.name ?? '').toLowerCase(),
            );
            return {
              name: String(ing.name ?? ''),
              type: ing.type as IngredientType,
              unit: ing.unit as MeasurementUnit,
              servings: Number(ing.servings) || 0,
              isNew: match === undefined,
              existingIngredientId: match?.id ?? null,
            };
          });
          runtime.onStepComplete(field, { ingredients: proposals });
        } else {
          runtime.onStepComplete(field, stepResult.data as Record<string, unknown>);
        }
      }
    }

    const generationStepsCompleted = completedSteps.filter(
      (s) => s !== 'validateIterationRequest' && s !== 'detectFieldsToUpdate',
    );
    const cancelled =
      (runtime.abortSignal?.aborted ?? false) ||
      generationStepsCompleted.length < stepsToRun.length;

    if (!cancelled) {
      const keepExistingTime = !fieldsToUpdate.includes('info');
      const prepTime = keepExistingTime
        ? existingProposal.prepTime
        : Math.floor((accumulatedResult.totalTime ?? 30) * 0.4);
      const cookTime = keepExistingTime
        ? existingProposal.cookTime
        : Math.ceil((accumulatedResult.totalTime ?? 30) * 0.6);

      const existingIngredients = store.getState().ingredients.items;

      const proposal: AgentMealProposal = {
        title: accumulatedResult.name ?? existingProposal.title,
        description: accumulatedResult.description ?? existingProposal.description,
        category: accumulatedResult.category ?? existingProposal.category,
        prepTime,
        cookTime,
        servingSize: accumulatedResult.servings ?? existingProposal.servingSize,
        imageUrl: existingProposal.imageUrl,
        instructions: accumulatedResult.instructions ?? existingProposal.instructions,
        ingredients: fieldsToUpdate.includes('ingredients')
          ? (accumulatedResult.ingredients ?? []).map((ing) => {
              const match = existingIngredients.find(
                (e) => e.name.toLowerCase() === ing.name.toLowerCase(),
              );
              return {
                name: ing.name,
                type: ing.type,
                unit: ing.unit,
                servings: ing.servings,
                isNew: match === undefined,
                existingIngredientId: match?.id ?? null,
              };
            })
          : existingProposal.ingredients,
      };

      accumulatedResult.proposal = proposal;
    }

    return { data: accumulatedResult, completedSteps, cancelled };
  },
} satisfies ActionHandler<MealIterationResult, MealIterationStepName>;
